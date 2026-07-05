import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import machineTestStyles from "../styles/machine-test.css?url";

export const links = () => [
  { rel: "stylesheet", href: machineTestStyles },
];

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function ConfigurePage() {
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    try {
      const savedProducts = window.localStorage.getItem("selectedMainProducts");

      if (!savedProducts) {
        setSelectedProducts([]);
        return;
      }

      const parsedProducts = JSON.parse(savedProducts);

      if (Array.isArray(parsedProducts)) {
        setSelectedProducts(parsedProducts);
      }
    } catch (error) {
      console.error("Selected product load error:", error);
      setSelectedProducts([]);
    }
  }, []);

  function goBackToProducts() {
    navigate("/app");
  }

  function goToAddons() {
    navigate("/app/configure/addons");
  }

  function goToCustomOptions() {
    navigate("/app/configure/custom-options");
  }

  return (
    <div className="machine-test-page">
      <div className="machine-test-header">
        <div>
          <h1>Configure Selected Products</h1>
          <p>
            Choose what you want to configure for the selected main product/products.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={goBackToProducts}
        >
          Back to products
        </button>
      </div>

      <div className="machine-test-card configure-selected-card">
        <h2>Selected main products</h2>

        {selectedProducts.length > 0 ? (
          <div className="selected-products-grid">
            {selectedProducts.map((product) => {
              const productImage =
                product.featuredMedia?.preview?.image?.url ||
                product.featuredImage?.url;

              const productAlt =
                product.featuredMedia?.preview?.image?.altText ||
                product.featuredImage?.altText ||
                product.title;

              return (
                <div className="selected-product-card" key={product.id}>
                  {productImage ? (
                    <img
                      className="selected-product-image"
                      src={productImage}
                      alt={productAlt}
                    />
                  ) : (
                    <div className="selected-product-image selected-product-image-empty">
                      No image
                    </div>
                  )}

                  <div className="selected-product-info">
                    <h3>{product.title}</h3>
                    <p>{product.handle}</p>

                    <span
                      className={`status-badge status-${product.status.toLowerCase()}`}
                    >
                      {product.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-configuration-state">
            <p>No selected products found.</p>
            <button
              type="button"
              className="primary-button"
              onClick={goBackToProducts}
            >
              Select products
            </button>
          </div>
        )}
      </div>

      <div className="configure-option-grid">
        <button
          type="button"
          className="configure-option-card"
          disabled={selectedProducts.length === 0}
          onClick={goToAddons}
        >
          <span className="configure-option-number">1</span>
          <h2>Add-on Product Selection</h2>
          <p>
            Select optional add-on products for the selected main product/products.
          </p>
        </button>

        <button
          type="button"
          className="configure-option-card"
          disabled={selectedProducts.length === 0}
          onClick={goToCustomOptions}
        >
          <span className="configure-option-number">2</span>
          <h2>Custom Option Creation</h2>
          <p>
            Create custom fields like text, textarea, number, dropdown, checkbox,
            and date.
          </p>
        </button>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="machine-test-page">
      <div className="machine-test-card">
        <h1>Configure page error</h1>
        <p>Please check the terminal console for the exact error.</p>
      </div>
    </div>
  );
}