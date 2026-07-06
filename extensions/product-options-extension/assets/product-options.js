window.addEventListener("load", function () {
    initializeAllProductOptionsExtensions();
});

document.addEventListener("shopify:section:load", function () {
    initializeAllProductOptionsExtensions();
});

document.addEventListener("custom-pdp:product-updated", function () {
    initializeAllProductOptionsExtensions();
});

function initializeAllProductOptionsExtensions() {
    const extensionRoots = document.querySelectorAll("[data-product-options-extension]");

    if (!extensionRoots.length) {
        return;
    }

    extensionRoots.forEach(function (extensionRoot) {
        initializeProductOptions(extensionRoot);
    });
}

function initializeProductOptions(extensionRoot) {
    if (!extensionRoot || extensionRoot.dataset.poInitialized === "true") {
        return;
    }

    extensionRoot.dataset.poInitialized = "true";

    const productInfo = extensionRoot.closest("product-info") || document.querySelector("product-info");
    const productFormElement = productInfo
        ? productInfo.querySelector("product-form")
        : document.querySelector("product-form");

    const productForm = productFormElement
        ? productFormElement.querySelector('form[action*="/cart/add"]')
        : document.querySelector('form[action*="/cart/add"]');

    if (!productForm) {
        showProductOptionsError(extensionRoot, "Product form not found.");
        return;
    }

    syncAddonVariantSelection(extensionRoot);

    productForm.addEventListener(
        "submit",
        function (event) {
            handleProductOptionsSubmit(event, extensionRoot, productForm, productFormElement);
        },
        true,
    );
}

function syncAddonVariantSelection(extensionRoot) {
    const addonCards = extensionRoot.querySelectorAll("[data-po-addon]");

    addonCards.forEach(function (addonCard) {
        const checkbox = addonCard.querySelector("[data-po-addon-checkbox]");
        const variantSelect = addonCard.querySelector("[data-po-addon-variant-select]");

        if (!checkbox || !variantSelect) {
            return;
        }

        variantSelect.addEventListener("change", function () {
            checkbox.value = variantSelect.value;
        });
    });
}

function handleProductOptionsSubmit(event, extensionRoot, productForm, productFormElement) {
    const customValidation = validateCustomFields(extensionRoot);

    if (!customValidation.valid) {
        event.preventDefault();
        event.stopImmediatePropagation();

        showProductOptionsError(extensionRoot, customValidation.message);
        return;
    }

    const selectedAddons = getSelectedAddons(extensionRoot);
    const customProperties = getCustomFieldProperties(extensionRoot);

    if (!selectedAddons.length && !Object.keys(customProperties).length) {
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    clearProductOptionsError(extensionRoot);
    setProductOptionsLoading(productFormElement, true);

    const formData = new FormData(productForm);
    const mainVariantId = formData.get("id");
    const quantity = Number(formData.get("quantity") || 1);

    if (!mainVariantId) {
        showProductOptionsError(extensionRoot, "Please select a product variant.");
        setProductOptionsLoading(productFormElement, false);
        return;
    }

    const bundleId = createBundleId(mainVariantId);

    const mainProperties = {
        ...customProperties,
        _bundle_id: bundleId,
        _bundle_role: "main",
    };

    const items = [
        {
            id: Number(mainVariantId),
            quantity: quantity > 0 ? quantity : 1,
            properties: mainProperties,
        },
    ];

    selectedAddons.forEach(function (addon) {
        if (!addon.variantId) {
            return;
        }

        items.push({
            id: Number(addon.variantId),
            quantity: quantity > 0 ? quantity : 1,
            properties: {
                _bundle_id: bundleId,
                _bundle_role: "addon",
                _bundle_parent_variant_id: String(mainVariantId),
                _bundle_addon_product_title: addon.title,
            },
        });
    });

    addBundleItemsToCart(items)
        .then(function (response) {
            if (response.status) {
                throw new Error(response.description || response.message || "Unable to add products to cart.");
            }

            renderCartAfterAdd(response, productFormElement);
        })
        .catch(function (error) {
            console.error("Product options add to cart error:", error);

            showProductOptionsError(
                extensionRoot,
                error.message || "Unable to add products to cart. Please try again.",
            );
        })
        .finally(function () {
            setProductOptionsLoading(productFormElement, false);
        });
}

function validateCustomFields(extensionRoot) {
    const fields = extensionRoot.querySelectorAll("[data-po-property-field]");

    for (const field of fields) {
        const label = field.dataset.propertyLabel || "This field";

        if (!field.required) {
            continue;
        }

        if (field.type === "checkbox" && !field.checked) {
            field.focus();

            return {
                valid: false,
                message: `${label} is required.`,
            };
        }

        if (field.type !== "checkbox" && !String(field.value || "").trim()) {
            field.focus();

            return {
                valid: false,
                message: `${label} is required.`,
            };
        }
    }

    return {
        valid: true,
        message: "",
    };
}

function getSelectedAddons(extensionRoot) {
    const selectedAddons = [];
    const addonCards = extensionRoot.querySelectorAll("[data-po-addon]");

    addonCards.forEach(function (addonCard) {
        const checkbox = addonCard.querySelector("[data-po-addon-checkbox]");

        if (!checkbox || !checkbox.checked || !checkbox.value) {
            return;
        }

        selectedAddons.push({
            variantId: checkbox.value,
            title: addonCard.dataset.addonProductTitle || "Add-on product",
        });
    });

    return selectedAddons;
}

function getCustomFieldProperties(extensionRoot) {
    const properties = {};
    const fields = extensionRoot.querySelectorAll("[data-po-property-field]");

    fields.forEach(function (field) {
        const label = field.dataset.propertyLabel;

        if (!label) {
            return;
        }

        if (field.type === "checkbox") {
            if (field.checked) {
                properties[label] = field.value || "Yes";
            }

            return;
        }

        const value = String(field.value || "").trim();

        if (value) {
            properties[label] = value;
        }
    });

    return properties;
}

function createBundleId(mainVariantId) {
    return `bundle_${mainVariantId}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function addBundleItemsToCart(items) {
    const cart = getCartDrawerOrNotification();

    const body = {
        items,
    };

    const sectionsToRender = getSectionsToRender(cart);

    if (sectionsToRender.length) {
        body.sections = sectionsToRender.map(function (section) {
            return section.id;
        });
        body.sections_url = window.location.pathname;
    }

    return fetch(getCartAddUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(body),
    }).then(function (response) {
        return response.json();
    });
}

function renderCartAfterAdd(response, productFormElement) {
    const cart = getCartDrawerOrNotification();

    if (!cart) {
        window.location.href = getCartUrl();
        return;
    }

    if (cart.classList.contains("is-empty")) {
        cart.classList.remove("is-empty");
    }

    if (typeof cart.setActiveElement === "function") {
        cart.setActiveElement(document.activeElement);
    }

    if (typeof cart.renderContents === "function") {
        try {
            cart.renderContents(response);
            return;
        } catch (error) {
            console.warn("Dawn cart renderContents failed. Using safe fallback render.", error);
        }
    }

    safelyRenderCartSections(response, cart);
    safelyOpenCart(cart, productFormElement);
}

function getCartDrawerOrNotification() {
    return document.querySelector("cart-drawer") || document.querySelector("cart-notification");
}

function getSectionsToRender(cart) {
    if (cart && typeof cart.getSectionsToRender === "function") {
        return cart.getSectionsToRender().filter(function (section) {
            return section && section.id;
        });
    }

    return [
        {
            id: "cart-drawer",
            selector: "#CartDrawer",
        },
        {
            id: "cart-icon-bubble",
            selector: "#cart-icon-bubble",
        },
    ];
}

function safelyRenderCartSections(response, cart) {
    if (!response || !response.sections) {
        return;
    }

    const sectionsToRender = getSectionsToRender(cart);

    sectionsToRender.forEach(function (section) {
        const sectionHtml = response.sections[section.id];

        if (!sectionHtml) {
            return;
        }

        const targetElement = findSectionTarget(section);

        if (!targetElement) {
            return;
        }

        const newHtml = getSectionInnerHTML(sectionHtml, section.selector);

        if (typeof newHtml !== "string") {
            return;
        }

        targetElement.innerHTML = newHtml;
    });
}

function findSectionTarget(section) {
    if (section.selector) {
        return document.querySelector(section.selector);
    }

    return document.getElementById(section.id);
}

function getSectionInnerHTML(html, selector) {
    const parsedDocument = new DOMParser().parseFromString(html, "text/html");

    if (!selector) {
        return parsedDocument.body.innerHTML;
    }

    const selectedElement = parsedDocument.querySelector(selector);

    if (selectedElement) {
        return selectedElement.innerHTML;
    }

    return parsedDocument.body.innerHTML;
}

function safelyOpenCart(cart, productFormElement) {
    if (!cart) {
        window.location.href = getCartUrl();
        return;
    }

    if (typeof cart.open === "function") {
        cart.open(productFormElement);
        return;
    }

    cart.classList.add("active");
    document.body.classList.add("overflow-hidden");
}

function getCartAddUrl() {
    if (window.routes && window.routes.cart_add_url) {
        return window.routes.cart_add_url;
    }

    return "/cart/add.js";
}

function getCartUrl() {
    if (window.routes && window.routes.cart_url) {
        return window.routes.cart_url;
    }

    return "/cart";
}

function setProductOptionsLoading(productFormElement, isLoading) {
    if (!productFormElement) {
        return;
    }

    const submitButton = productFormElement.querySelector('[type="submit"]');
    const spinner = productFormElement.querySelector(".loading__spinner");

    if (submitButton) {
        if (isLoading) {
            submitButton.setAttribute("aria-disabled", "true");
            submitButton.classList.add("loading");
        } else {
            submitButton.removeAttribute("aria-disabled");
            submitButton.classList.remove("loading");
        }
    }

    if (spinner) {
        spinner.classList.toggle("hidden", !isLoading);
    }
}

function showProductOptionsError(extensionRoot, message) {
    const errorBox = extensionRoot.querySelector("[data-po-error]");

    if (!errorBox) {
        alert(message);
        return;
    }

    errorBox.textContent = message;
    errorBox.hidden = false;
}

function clearProductOptionsError(extensionRoot) {
    const errorBox = extensionRoot.querySelector("[data-po-error]");

    if (!errorBox) {
        return;
    }

    errorBox.textContent = "";
    errorBox.hidden = true;
}