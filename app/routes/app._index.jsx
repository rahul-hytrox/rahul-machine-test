import { useMemo, useState } from "react";
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

export default function AppIndex() {
  const { products, query } = useLoaderData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedProducts, setSelectedProducts] = useState([]);

  const selectedCount = selectedProducts.length;

  const selectedProductData = useMemo(() => {
    return products.filter((product) => selectedProducts.includes(product.id));
  }, [products, selectedProducts]);

  function toggleProduct(productId) {
    setSelectedProducts((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }

      return [...current, productId];
    });
  }

  function selectSingleProduct(productId) {
    setSelectedProducts([productId]);
  }

  function handleContinue() {
    if (!selectedProductData.length) {
      alert("Please select at least one product.");
      return;
    }

    localStorage.setItem(
      "selectedMainProducts",
      JSON.stringify(selectedProductData),
    );

    navigate("/app/configure");
  }

  return (
    <div className="machine-test-page">
      <div className="machine-test-header">
        <div>
          <h1>Product Configuration</h1>
          <p>Select one or multiple main products to configure add-ons and custom fields.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          disabled={selectedCount === 0}
          onClick={handleContinue}
        >
          Continue {selectedCount > 0 ? `(${selectedCount})` : ""}
        </button>
      </div>

      <div className="machine-test-card">
        <Form method="get" className="search-form">
          <input
            type="search"
            name="q"
            placeholder="Search products"
            defaultValue={query || searchParams.get("q") || ""}
          />
          <button type="submit">Search</button>
        </Form>

        <div className="selection-help">
          <p>
            Selected products: <strong>{selectedCount}</strong>
          </p>

          <button
            type="button"
            className="secondary-button"
            disabled={selectedCount === 0}
            onClick={() => setSelectedProducts([])}
          >
            Clear selection
          </button>
        </div>

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
                <th>Single select</th>
              </tr>
            </thead>

            <tbody>
              {products.length > 0 ? (
                products.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);

                  return (
                    <tr key={product.id} className={isSelected ? "selected-row" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProduct(product.id)}
                          aria-label={`Select ${product.title}`}
                        />
                      </td>

                      <td>
                        {product.featuredMedia?.preview?.image?.url ? (
                          <img
                            className="product-thumb"
                            src={product.featuredMedia?.preview?.image?.url}
                            alt={product.featuredMedia?.preview?.image?.altText || product.title}
                          />
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

                      <td>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => selectSingleProduct(product.id)}
                        >
                          Select only
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No products found.
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