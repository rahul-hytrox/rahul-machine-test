import { useEffect, useMemo, useState } from "react";
import {
  Form,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "react-router";
import { authenticate } from "../shopify.server";
import machineTestStyles from "../styles/machine-test.css?url";

const ADDON_METAFIELD_NAMESPACE = "custom";
const ADDON_METAFIELD_KEY = "product_addons";

export const links = () => [
  { rel: "stylesheet", href: machineTestStyles },
];

function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function getNumericIdFromGid(gid) {
  if (!gid || typeof gid !== "string") {
    return "";
  }

  return gid.split("/").pop();
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("JSON parse error:", error);
    return fallback;
  }
}

function normalizeAddonProducts(products) {
  return products.map((product) => {
    const image = product.featuredMedia?.preview?.image;

    return {
      id: product.id,
      numericId: product.legacyResourceId || getNumericIdFromGid(product.id),
      title: product.title,
      handle: product.handle,
      status: product.status,
      image: image
        ? {
          url: image.url,
          altText: image.altText || product.title,
        }
        : null,
      variants: product.variants.edges.map((edge) => ({
        id: edge.node.id,
        numericId:
          edge.node.legacyResourceId || getNumericIdFromGid(edge.node.id),
        title: edge.node.title,
        price: edge.node.price,
        availableForSale: edge.node.availableForSale,
      })),
    };
  });
}

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";

  const searchQuery = query ? `title:*${query}*` : "";

  const response = await admin.graphql(
    `#graphql
      query getProducts($first: Int!, $query: String) {
        products(first: $first, query: $query, sortKey: TITLE) {
          edges {
            node {
              id
              legacyResourceId
              title
              handle
              status
              featuredMedia {
                preview {
                  image {
                    url
                    altText
                  }
                }
              }
              variants(first: 50) {
                edges {
                  node {
                    id
                    legacyResourceId
                    title
                    price
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    `,
    {
      variables: {
        first: 50,
        query: searchQuery || null,
      },
    },
  );

  const json = await response.json();

  if (json.errors) {
    console.error("Product loader GraphQL errors:", json.errors);
  }

  return {
    products: json.data?.products?.edges?.map((edge) => edge.node) || [],
    query,
  };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const intent = formData.get("intent");

  if (intent !== "save_addons") {
    return {
      ok: false,
      message: "Invalid add-on save request.",
    };
  }

  const mainProducts = safeJsonParse(formData.get("mainProducts") || "[]", []);
  const addonProducts = safeJsonParse(formData.get("addonProducts") || "[]", []);

  if (!Array.isArray(mainProducts) || mainProducts.length === 0) {
    return {
      ok: false,
      message: "Please select at least one main product.",
    };
  }

  if (!Array.isArray(addonProducts)) {
    return {
      ok: false,
      message: "Invalid add-on product data.",
    };
  }

  const normalizedAddons = normalizeAddonProducts(addonProducts);

  const metafields = mainProducts.map((product) => ({
    ownerId: product.id,
    namespace: ADDON_METAFIELD_NAMESPACE,
    key: ADDON_METAFIELD_KEY,
    type: "json",
    value: JSON.stringify({
      addonProducts: normalizedAddons,
      updatedAt: new Date().toISOString(),
    }),
  }));

  const mutation = `#graphql
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          owner {
            ... on Product {
              id
            }
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const metafieldChunks = chunkArray(metafields, 25);

  for (const chunk of metafieldChunks) {
    const response = await admin.graphql(mutation, {
      variables: {
        metafields: chunk,
      },
    });

    const json = await response.json();

    if (json.errors) {
      console.error("metafieldsSet GraphQL errors:", json.errors);

      return {
        ok: false,
        message: "Shopify GraphQL error while saving add-ons.",
      };
    }

    const userErrors = json.data?.metafieldsSet?.userErrors || [];

    if (userErrors.length > 0) {
      return {
        ok: false,
        message: userErrors.map((error) => error.message).join(", "),
      };
    }
  }

  return {
    ok: true,
    selectedAddonIds: normalizedAddons.map((product) => product.id),
    message: "Add-on configuration saved to product metafields.",
  };
};

export default function AddonsPage() {
  const { products, query } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mainProducts, setMainProducts] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);

  useEffect(() => {
    try {
      const savedProducts = window.localStorage.getItem("selectedMainProducts");
      const savedAddons = window.localStorage.getItem("selectedAddonProducts");

      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);

        if (Array.isArray(parsedProducts)) {
          setMainProducts(parsedProducts);
        }
      }

      if (savedAddons) {
        const parsedAddons = JSON.parse(savedAddons);

        if (Array.isArray(parsedAddons)) {
          setSelectedAddons(parsedAddons);
        }
      }
    } catch (error) {
      console.error("Add-on page load error:", error);
    }
  }, []);

  useEffect(() => {
    if (!fetcher.data) {
      return;
    }

    if (fetcher.data.ok) {
      window.localStorage.setItem(
        "selectedAddonProducts",
        JSON.stringify(fetcher.data.selectedAddonIds || []),
      );

      alert(fetcher.data.message);
      navigate("/app/configure");
      return;
    }

    alert(fetcher.data.message || "Unable to save add-ons.");
  }, [fetcher.data, navigate]);

  const mainProductIds = useMemo(() => {
    return mainProducts.map((product) => product.id);
  }, [mainProducts]);

  const addonProducts = useMemo(() => {
    return products.filter((product) => !mainProductIds.includes(product.id));
  }, [products, mainProductIds]);

  const selectedAddonData = useMemo(() => {
    return addonProducts.filter((product) => selectedAddons.includes(product.id));
  }, [addonProducts, selectedAddons]);

  const isSaving = fetcher.state !== "idle";

  function toggleAddon(productId) {
    setSelectedAddons((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }

      return [...current, productId];
    });
  }

  function saveAddonConfiguration() {
    if (mainProducts.length === 0) {
      alert("Please select at least one main product.");
      return;
    }

    fetcher.submit(
      {
        intent: "save_addons",
        mainProducts: JSON.stringify(mainProducts),
        addonProducts: JSON.stringify(selectedAddonData),
      },
      {
        method: "post",
      },
    );
  }

  return (
    <div className="machine-test-page">
      <div className="machine-test-header">
        <div>
          <h1>Add-on Product Selection</h1>
          <p>Select optional add-on products for the selected main product/products.</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/app/configure")}
        >
          Back
        </button>
      </div>

      <div className="machine-test-card configure-selected-card">
        <h2>Main products</h2>

        {mainProducts.length > 0 ? (
          <div className="selected-products-grid">
            {mainProducts.map((product) => {
              const image =
                product.featuredMedia?.preview?.image?.url ||
                product.featuredImage?.url;

              const alt =
                product.featuredMedia?.preview?.image?.altText ||
                product.featuredImage?.altText ||
                product.title;

              return (
                <div className="selected-product-card" key={product.id}>
                  {image ? (
                    <img className="selected-product-image" src={image} alt={alt} />
                  ) : (
                    <div className="selected-product-image selected-product-image-empty">
                      No image
                    </div>
                  )}

                  <div className="selected-product-info">
                    <h3>{product.title}</h3>
                    <p>{product.handle}</p>
                    <span className={`status-badge status-${product.status.toLowerCase()}`}>
                      {product.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No main product selected.</p>
        )}
      </div>

      <div className="machine-test-card addon-selection-card">
        <div className="addon-card-header">
          <div>
            <h2>Choose add-on products</h2>
            <p>
              Selected add-ons: <strong>{selectedAddons.length}</strong>
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            disabled={mainProducts.length === 0 || isSaving}
            onClick={saveAddonConfiguration}
          >
            {isSaving ? "Saving..." : "Save add-ons"}
          </button>
        </div>

        <Form method="get" className="search-form">
          <input
            type="search"
            name="q"
            placeholder="Search add-on products"
            defaultValue={query || searchParams.get("q") || ""}
          />
          <button type="submit">Search</button>
        </Form>

        <div className="product-table-wrap">
          <table className="product-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Image</th>
                <th>Product title</th>
                <th>Status</th>
                <th>Handle</th>
                <th>Variants</th>
              </tr>
            </thead>

            <tbody>
              {addonProducts.length > 0 ? (
                addonProducts.map((product) => {
                  const isSelected = selectedAddons.includes(product.id);
                  const image = product.featuredMedia?.preview?.image?.url;
                  const alt = product.featuredMedia?.preview?.image?.altText || product.title;

                  return (
                    <tr key={product.id} className={isSelected ? "selected-row" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAddon(product.id)}
                          aria-label={`Select add-on ${product.title}`}
                        />
                      </td>

                      <td>
                        {image ? (
                          <img className="product-thumb" src={image} alt={alt} />
                        ) : (
                          <div className="product-thumb product-thumb-empty">No image</div>
                        )}
                      </td>

                      <td>
                        <strong>{product.title}</strong>
                      </td>

                      <td>
                        <span className={`status-badge status-${product.status.toLowerCase()}`}>
                          {product.status}
                        </span>
                      </td>

                      <td>{product.handle}</td>
                      <td>{product.variants.edges.length}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No add-on products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}