export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("product_id");
  const handle = url.searchParams.get("handle");

  return Response.json({
    productId,
    handle,
    hasConfiguration: true,
    addons: [
      {
        id: "addon_1",
        title: "Your Products Title Here",
        price: "$18.00",
        compareAtPrice: "$34.00",
        image: "",
        variants: [
          {
            name: "Color",
            values: ["Gray", "Red", "Black"],
          },
          {
            name: "Element",
            values: ["Cotton", "Silk", "Leather"],
          },
        ],
      },
      {
        id: "addon_2",
        title: "Your Products Title Here",
        price: "$18.00",
        compareAtPrice: "$34.00",
        image: "",
        variants: [],
      },
      {
        id: "addon_3",
        title: "Your Products Title Here",
        price: "$18.00",
        compareAtPrice: "$34.00",
        image: "",
        variants: [
          {
            name: "Color",
            values: ["Gray", "Red", "Black"],
          },
          {
            name: "Size",
            values: ["XS", "S", "M", "L", "XL"],
          },
          {
            name: "Element",
            values: ["Cotton", "Silk", "Leather"],
          },
        ],
      },
    ],
    customFields: [
      {
        id: "name",
        type: "text",
        label: "Name",
        placeholder: "Name",
        required: false,
      },
      {
        id: "number",
        type: "number",
        label: "Number",
        placeholder: "Number",
        required: false,
      },
      {
        id: "packaging",
        type: "dropdown",
        label: "Packaging Type",
        placeholder: "Select",
        required: true,
        options: ["Gift Box", "Paper Wrap", "No Packaging"],
      },
      {
        id: "dob",
        type: "date",
        label: "DOB",
        placeholder: "DOB",
        required: false,
      },
      {
        id: "message",
        type: "textarea",
        label: "Message",
        placeholder: "Message",
        required: false,
      },
    ],
  });
};