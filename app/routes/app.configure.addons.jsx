import { useEffect, useMemo, useState } from "react";
import { Form, useLoaderData, useNavigate, useSearchParams } from "react-router";
import { authenticate } from "../shopify.server";
import machineTestStyles from "../styles/machine-test.css?url";

export const links = () => [
  { rel: "stylesheet", href: machineTestStyles },
];

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
              variants(first: 20) {
                edges {
                  node {
                    id
                    title
                    price
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

  return {
    products: json.data.products.edges.map((edge) => edge.node),
    query,
  };
};

export default function AddonsPage() {
  const { products, query } = useLoaderData();
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

  const mainProductIds = useMemo(() => {
    return mainProducts.map((product) => product.id);
  }, [mainProducts]);

  const addonProducts = useMemo(() => {
    return products.filter((product) => !mainProductIds.includes(product.id));
  }, [products, mainProductIds]);

  const selectedAddonData = useMemo(() => {
    return addonProducts.filter((product) => selectedAddons.includes(product.id));
  }, [addonProducts, selectedAddons]);

  function toggleAddon(productId) {
    setSelectedAddons((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }

      return [...current, productId];
    });
  }

  function saveAddonConfiguration() {
    const config = {
      mainProducts,
      addonProducts: selectedAddonData,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem("selectedAddonProducts", JSON.stringify(selectedAddons));
    window.localStorage.setItem("addonConfiguration", JSON.stringify(config));

    alert("Add-on configuration saved.");
    navigate("/app/configure");
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
              const image = product.featuredMedia?.preview?.image?.url;
              const alt = product.featuredMedia?.preview?.image?.altText || product.title;

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
            <p>Selected add-ons: <strong>{selectedAddons.length}</strong></p>
          </div>

          <button
            type="button"
            className="primary-button"
            disabled={mainProducts.length === 0}
            onClick={saveAddonConfiguration}
          >
            Save add-ons
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