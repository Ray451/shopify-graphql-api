import axios from "axios";

const adminApiToken = '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';
const storefrontApiToken = '700c88fcf8f4e9329316e9c154258266';
const adminStoreUrl = 'https://green-check-1183.myshopify.com/admin/api/2023-07/graphql.json';
const storefrontStoreUrl = 'https://green-check-1183.myshopify.com/api/2023-07/graphql.json';

async function getProductsByName(productName) {
  const admin_query = `
    query {
      products(first: 50, query: "title:*${productName}*") {
        edges {
          node {
            title
            variants(first: 5) {
              edges {
                node {
                  title
                  price
                }
              }
            }
          }
        }
      }
    }
  `;

  const storefront_query = `
    query {
      products(first: 50, query: "title:*${productName}*") {
        edges {
          node {
            title
            variants(first: 5) {
              edges {
                node {
                  title
                  price {
                    amount
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    /* This is the case of using the Shopify Admin API */
    const adminResponse = await axios.post(
      adminStoreUrl, 
      { query: admin_query }, 
      { headers: { 'X-Shopify-Access-Token': adminApiToken } 
    });
    const adminProducts = adminResponse.data.data.products.edges;
    if (adminProducts.length === 0) {
      console.log(`No products found for the name '${productName}'.`);
      return;
    }
    console.log("========= Product Results using the Shopify AdminAPI ========= \n")

    let tempVarients = [];
    adminProducts.forEach((product) => {
      const { title, variants } = product.node;
      variants.edges.forEach((variant) => {
        tempVarients.push({title: title, variant: variant})
      });
    });
    const sortedProducts = tempVarients.sort((a, b) => {
      return a.variant.node.price - b.variant.node.price;
    })

    sortedProducts.forEach((product) => {
      console.log(`${product.title} - variant ${product.variant.node.title} - price $${product.variant.node.price}`);
    });

    console.log("============================================================ \n")

    /* This is the case of using the Shopify Storefront API */
    const storefrontResponse = await axios.post(
      storefrontStoreUrl,
      { query: storefront_query }, 
      { headers: { 'X-Shopify-Storefront-Access-Token': storefrontApiToken } }
    );
    const storefrontProducts = storefrontResponse.data.data.products.edges;
    if (storefrontProducts.length === 0) {
      console.log(`No products found for the name '${productName}'.`);
      return;
    }
    
    console.log("========= Product Results using the Shopify Storefront API ========= \n")

    let tempVarients_storeFront = [];
    storefrontProducts.forEach((product) => {
      const { title, variants } = product.node;
      variants.edges.forEach((variant) => {
        tempVarients_storeFront.push({title: title, variant: variant})
      });      
    });
    const sortedStorefrontProducts = tempVarients_storeFront.sort((a, b) => {
      return a.variant.node.price.amount - b.variant.node.price.amount;
    })

    sortedStorefrontProducts.forEach((product) => {
      console.log(`${product.title} - variant ${product.variant.node.title} - price $${product.variant.node.price.amount}`);
    });

    console.log("============================================================ ")

  } catch (error) {
    console.error('Error fetching products:', error.message);
  }
}

const args = process.argv.slice(2);
const productName = args[1];

if (productName) {
  getProductsByName(productName);
} else {
  console.log('Please provide a product name as input. Example: node app.js -name glove');
}