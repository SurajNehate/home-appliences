# angular-ecommerce
Home decor ecommerce portal with admin catalog management and guest shopping. Users can register as members to browse products and make purchases.

# Project Setup
**Step 1:** clone the project: ``` git clone https://github.com/SrikrushnaP/angular-ecommerce.git ```

**Step 2:** ``` cd angular-ecommerce ```

 **Step 3:** ``` git pull origin develop ``` or ``` master ``` 

**Step 4:** Install Node form  https://nodejs.org/en/

**Step 5:** ``` npm install ```

**Step 6:** ``` npm install -g json-server ``` (Install JSON mock server)

**Step 7:** ```npm install -g @angular/cli ``` (Install angular CLI)

**Step 8:** Open two terminal/command prompt  

**Step 9:** In one run command:   ``` ng serve ```

**Step 10:** Another one run command:  ``` json-server --watch mock-api-data.json ```


Now you can ready to go 

**Step 11:** Open your browser and type: http://localhost:4200

If you want to see the mock api on your browser you can hit the link: http://localhost:3000/

If you want to learn more on mock API you can go through the doc https://www.npmjs.com/package/json-server

# Project Documentation: 
https://docs.google.com/document/d/1NdB3SdAbKSFcPooap-ddpHdQQxBDvAieH2bPF4NCLMU/edit?usp=sharing

---

## Static Catalog + Netlify (Home Decor)

This project now supports a fully static catalog suitable for Netlify deployments:

- Product data: `src/assets/products.json`
- Product images: Public Google Drive URLs in the form `https://drive.google.com/uc?export=view&id=<FILE_ID>`
- Guest cart: browser localStorage
- Checkout & Contact: Netlify Forms (email notifications)
- Admin: Simple static login and a Catalog Editor that lets you modify products in-memory and download an updated `products.json` file

### Admin Login (static)
Configure static admin credentials in `src/environments/environment.ts`:

```
adminLogin: { username: 'admin', password: 'admin123' }
```

Login at `/admin-login`. On success, you’ll be redirected to `/admin/catalog`.

### Admin Catalog Editor
- Go to `/admin/catalog`
- Add/Update/Delete products
- Click "Download JSON" to download the updated `products.json`
- Replace `src/assets/products.json` with the downloaded file and commit/push to trigger Netlify auto-deploy

### Google Drive images
- Upload image to Google Drive
- Right-click → Share → Anyone with the link
- Get the file ID from the share link
- Use: `https://drive.google.com/uc?export=view&id=<FILE_ID>` as `imageUrl`

### Netlify Forms (Checkout & Contact)
- Hidden forms are registered in `src/index.html`
- The Checkout page (`/checkout-guest`) and Contact page (`/contact-us`) submit programmatically to Netlify Forms
- In Netlify dashboard → Site settings → Forms → Notifications → add email notifications for `checkout` and `contact` forms

### Public Pages
- Home: `/`
- Catalog: `/catalog` (categories: Curtains, Appliances)
- Product detail: `/catalog/:id`
- Cart: `/cart`
- Checkout: `/checkout-guest`
- Contact: `/contact-us`

### Data Sources
The application supports two data source configurations:

1. **Static Mode (Recommended for Netlify)**: 
   - User data: `src/assets/users.json`
   - Product data: `src/assets/products.json`
   - No server required, works with static hosting

2. **Full Development Mode (with JSON Server)**:
   - All data: `mock-api-data.json` 
   - Requires `json-server --watch mock-api-data.json` running on port 3000
   - Useful for development with API-like behavior

**Current Implementation**: The app now uses static JSON files by default. The admin interface allows editing and downloading updated JSON files for manual deployment.

### Notes
- No server required for catalog and checkout/contact emails (Netlify handles form notifications)
- For advanced automation (auto-save products), consider moving `products.json` to a backend or using GitHub API write access via Netlify Functions
