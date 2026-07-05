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

const FIELD_TYPES = [
  { label: "Text input", value: "text" },
  { label: "Textarea", value: "textarea" },
  { label: "Number input", value: "number" },
  { label: "Dropdown", value: "dropdown" },
  { label: "Checkbox", value: "checkbox" },
  { label: "Date field", value: "date" },
];

export default function CustomOptionsPage() {
  const navigate = useNavigate();
  const [mainProducts, setMainProducts] = useState([]);
  const [fields, setFields] = useState([]);

  const [fieldForm, setFieldForm] = useState({
    type: "text",
    label: "",
    placeholder: "",
    required: false,
    options: "",
  });

  useEffect(() => {
    try {
      const savedProducts = window.localStorage.getItem("selectedMainProducts");
      const savedFields = window.localStorage.getItem("customOptionFields");

      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        if (Array.isArray(parsedProducts)) {
          setMainProducts(parsedProducts);
        }
      }

      if (savedFields) {
        const parsedFields = JSON.parse(savedFields);
        if (Array.isArray(parsedFields)) {
          setFields(parsedFields);
        }
      }
    } catch (error) {
      console.error("Custom options load error:", error);
    }
  }, []);

  function updateFieldForm(key, value) {
    setFieldForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function addField() {
    if (!fieldForm.label.trim()) {
      alert("Please enter field label.");
      return;
    }

    if (fieldForm.type === "dropdown" && !fieldForm.options.trim()) {
      alert("Please add dropdown options.");
      return;
    }

    const newField = {
      id: `field_${Date.now()}`,
      type: fieldForm.type,
      label: fieldForm.label.trim(),
      placeholder: fieldForm.placeholder.trim(),
      required: fieldForm.required,
      options:
        fieldForm.type === "dropdown"
          ? fieldForm.options
              .split(",")
              .map((option) => option.trim())
              .filter(Boolean)
          : [],
    };

    setFields((current) => [...current, newField]);

    setFieldForm({
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      options: "",
    });
  }

  function removeField(fieldId) {
    setFields((current) => current.filter((field) => field.id !== fieldId));
  }

  function saveCustomFields() {
    const config = {
      mainProducts,
      fields,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem("customOptionFields", JSON.stringify(fields));
    window.localStorage.setItem("customOptionConfiguration", JSON.stringify(config));

    alert("Custom options saved.");
    navigate("/app/configure");
  }

  return (
    <div className="machine-test-page">
      <div className="machine-test-header">
        <div>
          <h1>Custom Option Creation</h1>
          <p>Create custom input fields for the selected main product/products.</p>
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

      <div className="machine-test-card custom-options-builder-card">
        <div className="custom-options-header">
          <div>
            <h2>Create field</h2>
            <p>Add label, placeholder, required status, and options if needed.</p>
          </div>

          <button
            type="button"
            className="primary-button"
            disabled={mainProducts.length === 0}
            onClick={saveCustomFields}
          >
            Save custom fields
          </button>
        </div>

        <div className="field-builder-grid">
          <div className="field-builder-form">
            <label>
              Field type
              <select
                value={fieldForm.type}
                onChange={(event) => updateFieldForm("type", event.target.value)}
              >
                {FIELD_TYPES.map((fieldType) => (
                  <option key={fieldType.value} value={fieldType.value}>
                    {fieldType.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Label
              <input
                type="text"
                value={fieldForm.label}
                placeholder="Example: Name on Product"
                onChange={(event) => updateFieldForm("label", event.target.value)}
              />
            </label>

            <label>
              Placeholder
              <input
                type="text"
                value={fieldForm.placeholder}
                placeholder="Example: Enter your name"
                onChange={(event) =>
                  updateFieldForm("placeholder", event.target.value)
                }
              />
            </label>

            {fieldForm.type === "dropdown" && (
              <label>
                Dropdown options
                <input
                  type="text"
                  value={fieldForm.options}
                  placeholder="Example: Gift Box, Paper Wrap, No Packaging"
                  onChange={(event) =>
                    updateFieldForm("options", event.target.value)
                  }
                />
                <small>Separate options with comma.</small>
              </label>
            )}

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={fieldForm.required}
                onChange={(event) =>
                  updateFieldForm("required", event.target.checked)
                }
              />
              Required field
            </label>

            <button type="button" className="secondary-button" onClick={addField}>
              Add field
            </button>
          </div>

          <div className="field-preview-panel">
            <h3>Created fields</h3>

            {fields.length > 0 ? (
              <div className="created-fields-list">
                {fields.map((field) => (
                  <div className="created-field-card" key={field.id}>
                    <div>
                      <h4>
                        {field.label}
                        {field.required ? <span>Required</span> : <span>Optional</span>}
                      </h4>

                      <p>Type: {field.type}</p>

                      {field.placeholder && <p>Placeholder: {field.placeholder}</p>}

                      {field.options.length > 0 && (
                        <p>Options: {field.options.join(", ")}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => removeField(field.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-text">No custom fields created yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}