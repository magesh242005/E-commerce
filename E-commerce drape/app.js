// ============================================================
//  DRAPE — Main Application (app.js)
// ============================================================

// ---- STATE ----
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('drape_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('drape_wishlist_ids') || '[]');
let currentUser = null;
let currentProduct = null;
let selectedSize = null;
let selectedColor = null;
let selectedQty = 1;
let displayedCount = 8;
let filteredProducts = [];
let priceLimit = 10000;
let activeCategory = 'All';
let activeSort = 'default';
let activeRating = 0;

// ---- DEMO PRODUCTS (fallback when Supabase not configured) ----
// Generic image error handler: silently tries next image, then falls back to placeholder.
function handleImageError(el) {
  el.onerror = null; // prevent infinite loops
  try {
    const ds = el.getAttribute('data-images');
    let images = [];
    if (ds) {
      try { images = JSON.parse(ds); } catch (e) { images = String(ds).split('|').filter(Boolean); }
    }
    let idx = parseInt(el.getAttribute('data-img-idx') || '0', 10);
    if (images && images.length && idx < images.length - 1) {
      idx = idx + 1;
      el.setAttribute('data-img-idx', String(idx));
      const next = images[idx];
      if (next) {
        el.onerror = function() { handleImageError(this); };
        el.src = next;
      } else {
        el.src = getPlaceholderSrc(400, 530, 'DRAPE');
      }
      return;
    }
    // No more images — silent SVG placeholder, no toast, no badge
    el.src = getPlaceholderSrc(400, 530, 'DRAPE');
    el.removeAttribute('data-img-idx');
  } catch (e) {
    try { el.style.background = 'var(--cream)'; } catch (_) {}
  }
}


// Returns a data URI for a simple SVG placeholder so we avoid external placeholder requests
function getPlaceholderSrc(width = 400, height = 530, label = 'DRAPE') {
  try {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><rect width='100%' height='100%' fill='%23EDE8DC'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23888' font-family='Arial, Helvetica, sans-serif' font-size='${Math.floor(width/12)}'>${label}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  } catch (e) {
    return '';
  }
}
const DEMO_PRODUCTS = [
  { id: '1', name: 'Classic White Oxford Shirt', description: 'A timeless Oxford shirt crafted from 100% premium cotton. Perfect for both formal and casual occasions. Features a button-down collar, chest pocket, and a relaxed fit that works for any body type.', price: 1299, original_price: 1999, category: 'Men', tags: ['formal','casual','summer'], sizes: ['S','M','L','XL','XXL'], colors: [{name:'White',hex:'#FFFFFF'},{name:'Sky Blue',hex:'#87CEEB'},{name:'Olive',hex:'#808000'}], images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6a8f2a3b50d1?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6b8f2a3b50d2?w=1200&auto=format&fit=crop'], rating: 4.8, review_count: 245, is_featured: true, badge: 'Bestseller', stock: 50 },
  { id: '2', name: 'Floral Wrap Dress', description: 'Elegant wrap dress with a beautiful floral print. Flattering silhouette for all body types. Made from lightweight rayon that drapes beautifully.', price: 2499, original_price: 3499, category: 'Women', tags: ['summer','casual'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Floral Blue',hex:'#6B9ECC'},{name:'Floral Red',hex:'#CC6B6B'}], images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6a8f2a3b50d1?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6b8f2a3b50d2?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1503342452485-86f7b4a1b8d2?w=1200&auto=format&fit=crop'], rating: 4.7, review_count: 189, is_featured: true, badge: 'New', stock: 30 },
  { id: '3', name: 'Slim Fit Chinos', description: 'Modern slim-fit chinos in premium stretch fabric. Clean lines and a tailored silhouette. Great for office or weekend.', price: 1799, original_price: null, category: 'Men', tags: ['casual','formal'], sizes: ['28','30','32','34','36'], colors: [{name:'Khaki',hex:'#C3B091'},{name:'Navy',hex:'#1A3A5C'},{name:'Olive',hex:'#6B7C3A'}], images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&auto=format&fit=crop'], rating: 4.6, review_count: 312, is_featured: false, badge: null, stock: 45 },
  { id: '4', name: 'Printed Cotton Kurta', description: 'Beautiful hand-block printed kurta in soft breathable cotton. Traditional craftsmanship meets contemporary design.', price: 1599, original_price: 2199, category: 'Women', tags: ['casual','formal','summer'], sizes: ['S','M','L','XL'], colors: [{name:'Indigo',hex:'#4B0082'},{name:'Rust',hex:'#B7410E'}], images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6a8f2a3b50d1?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1491897554428-130a60dd4757?w=1200&auto=format&fit=crop'], rating: 4.9, review_count: 156, is_featured: true, badge: 'Sale', stock: 25 },
  { id: '5', name: 'Kids Rainbow Tee', description: 'Soft organic cotton t-shirt with a fun rainbow print. Pre-washed for extra softness. Safe dyes, gentle on sensitive skin.', price: 599, original_price: 799, category: 'Kids', tags: ['casual','summer'], sizes: ['2-3Y','4-5Y','6-7Y','8-9Y','10-11Y'], colors: [{name:'White',hex:'#FFFFFF'},{name:'Yellow',hex:'#FFE066'}], images: ['https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6a8f2a3b50d1?w=1200&auto=format&fit=crop'], rating: 4.5, review_count: 98, is_featured: false, badge: null, stock: 60 },
  { id: '6', name: 'Leather Belt', description: 'Genuine full-grain leather belt with a brushed gold buckle. Sturdy, elegant, and built to last decades.', price: 899, original_price: null, category: 'Accessories', tags: ['formal','casual'], sizes: ['28','30','32','34','36','38'], colors: [{name:'Tan',hex:'#D2691E'},{name:'Black',hex:'#1C1C1C'}], images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6a8f2a3b50d1?w=1200&auto=format&fit=crop'], rating: 4.4, review_count: 67, is_featured: false, badge: null, stock: 80 },
  { id: '7', name: 'Striped Polo Shirt', description: 'Classic striped polo in premium piqué cotton. A wardrobe staple that takes you from casual to smart effortlessly.', price: 1199, original_price: 1599, category: 'Men', tags: ['casual','summer'], sizes: ['S','M','L','XL','XXL'], colors: [{name:'Navy/White',hex:'#1A3A5C'},{name:'Red/White',hex:'#CC3333'}], images: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6a8f2a3b50d1?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=1200&auto=format&fit=crop'], rating: 4.6, review_count: 203, is_featured: true, badge: null, stock: 40 },
  { id: '8', name: 'Maxi Floral Skirt', description: 'Flowy maxi skirt in lightweight chiffon. Vibrant floral pattern with an elastic waistband for all-day comfort.', price: 1899, original_price: 2599, category: 'Women', tags: ['summer','casual'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Tropical',hex:'#E67E22'},{name:'Garden',hex:'#27AE60'}], images: ['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6b8f2a3b50d2?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1200&auto=format&fit=crop'], rating: 4.8, review_count: 134, is_featured: true, badge: 'Trending', stock: 35 },
  { id: '9', name: 'Denim Jacket', description: 'Classic denim jacket with a modern slim fit. Stone-washed for a vintage look. Features chest pockets and button fastening.', price: 2999, original_price: 3999, category: 'Men', tags: ['casual'], sizes: ['S','M','L','XL','XXL'], colors: [{name:'Light Wash',hex:'#6FA8DC'},{name:'Dark Wash',hex:'#2C4A7C'}], images: ['https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800&auto=format&fit=crop'], rating: 4.7, review_count: 421, is_featured: false, badge: null, stock: 20 },
  { id: '10', name: 'Silk Scarf', description: 'Luxurious 100% silk scarf with an artistic geometric print. Wear as a neck scarf, headband, or bag accessory.', price: 1299, original_price: null, category: 'Accessories', tags: ['formal','casual'], sizes: ['One Size'], colors: [{name:'Navy',hex:'#1A3A5C'},{name:'Burgundy',hex:'#800020'},{name:'Forest',hex:'#2D5A27'}], images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop'], rating: 4.5, review_count: 89, is_featured: false, badge: null, stock: 55 },
  { id: '11', name: 'Kids Denim Dungaree', description: 'Adorable denim dungaree with adjustable straps and cute floral embroidery at the chest. Durable and washable.', price: 1099, original_price: 1499, category: 'Kids', tags: ['casual'], sizes: ['2-3Y','4-5Y','6-7Y','8-9Y'], colors: [{name:'Blue',hex:'#4A90D9'},{name:'Black',hex:'#333333'}], images: ['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop'], rating: 4.6, review_count: 112, is_featured: false, badge: null, stock: 40 },
  { id: '12', name: 'Linen Blazer', description: 'Lightweight unlined linen blazer in a relaxed fit. Perfect for summer weddings, brunches, and smart-casual events.', price: 3499, original_price: 4999, category: 'Men', tags: ['formal','summer'], sizes: ['S','M','L','XL'], colors: [{name:'Beige',hex:'#D4C5A9'},{name:'White',hex:'#FAFAFA'},{name:'Navy',hex:'#1A3A5C'}], images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1200&auto=format&fit=crop'], rating: 4.8, review_count: 78, is_featured: true, badge: 'New', stock: 15 },
  { id: '13', name: 'Embroidered Blouse', description: 'Delicate hand-embroidered blouse in breathable cotton voile. Loose peasant fit with adjustable drawstring neckline.', price: 1699, original_price: 2299, category: 'Women', tags: ['casual','formal'], sizes: ['XS','S','M','L','XL'], colors: [{name:'White',hex:'#FAFAFA'},{name:'Dusty Pink',hex:'#D4A0A0'}], images: ['https://images.unsplash.com/photo-1485462537746-965f33f4f4c2?w=800&auto=format&fit=crop'], rating: 4.7, review_count: 167, is_featured: false, badge: null, stock: 30 },
  { id: '14', name: 'Canvas Tote Bag', description: 'Sturdy natural canvas tote with leather handles and an inner zip pocket. Perfect for daily essentials.', price: 799, original_price: null, category: 'Accessories', tags: ['casual'], sizes: ['One Size'], colors: [{name:'Natural',hex:'#D4C5A9'},{name:'Black',hex:'#1C1C1C'}], images: ['https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&auto=format&fit=crop'], rating: 4.3, review_count: 245, is_featured: false, badge: null, stock: 90 },
  { id: '15', name: 'Kids Floral Dress', description: 'Sweet floral dress in soft cotton with smocked detailing and a satin bow at the back. Machine washable.', price: 899, original_price: 1199, category: 'Kids', tags: ['casual','summer'], sizes: ['2-3Y','4-5Y','6-7Y','8-9Y','10-11Y'], colors: [{name:'Pink',hex:'#FFB6C1'},{name:'Yellow',hex:'#FFE082'}], images: ['https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&auto=format&fit=crop'], rating: 4.7, review_count: 89, is_featured: false, badge: null, stock: 45 },
  { id: '16', name: 'Wide-Leg Trousers', description: 'Sophisticated wide-leg trousers in draped crepe fabric. High waist with a flowing silhouette that elongates the leg.', price: 2199, original_price: 2999, category: 'Women', tags: ['formal','casual'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Black',hex:'#1C1C1C'},{name:'Ecru',hex:'#F0EAD6'},{name:'Caramel',hex:'#C68642'}], images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6b8f2a3b50d2?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1495121605193-b116b5b09a27?w=1200&auto=format&fit=crop'], rating: 4.6, review_count: 198, is_featured: true, badge: null, stock: 25 },
  { id: '17', name: 'Oversized Hoodie', description: 'Ultra-soft fleece-lined hoodie in a relaxed oversized fit. Kangaroo pocket, adjustable drawstring. Perfect for lounging or layering.', price: 1899, original_price: 2499, category: 'Men', tags: ['casual'], sizes: ['S','M','L','XL','XXL'], colors: [{name:'Charcoal',hex:'#4A4A4A'},{name:'Cream',hex:'#FFFDD0'},{name:'Forest Green',hex:'#2D5A27'}], images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6a8f2a3b50d1?w=1200&auto=format&fit=crop'], rating: 4.8, review_count: 312, is_featured: true, badge: 'Bestseller', stock: 40 },
  { id: '18', name: 'Pleated Midi Skirt', description: 'Elegant knife-pleated midi skirt in satin-finish fabric. Fitted at the waist with a side zip. Transitions from day to evening effortlessly.', price: 2299, original_price: 3199, category: 'Women', tags: ['formal','casual'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Blush',hex:'#FFB6C1'},{name:'Midnight Blue',hex:'#191970'},{name:'Champagne',hex:'#FAD5A5'}], images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b4ac0?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1503342452485-86f7b4a1b8d2?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6b8f2a3b50d2?w=1200&auto=format&fit=crop'], rating: 4.7, review_count: 143, is_featured: true, badge: 'New', stock: 30 },
  { id: '19', name: 'Kids Jogger Set', description: 'Matching hoodie and jogger set in soft French terry cotton. Ribbed cuffs and fun animal patch on the chest. Easy machine wash.', price: 1299, original_price: 1799, category: 'Kids', tags: ['casual'], sizes: ['2-3Y','4-5Y','6-7Y','8-9Y','10-11Y'], colors: [{name:'Sky Blue',hex:'#87CEEB'},{name:'Mint',hex:'#98FF98'}], images: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop'], rating: 4.6, review_count: 87, is_featured: false, badge: null, stock: 55 },
  { id: '20', name: 'Woven Straw Hat', description: 'Handwoven natural straw hat with a wide brim and grosgrain ribbon band. Packable and perfect for beach or garden days.', price: 699, original_price: null, category: 'Accessories', tags: ['summer','casual'], sizes: ['One Size'], colors: [{name:'Natural',hex:'#D4C5A9'},{name:'Black Band',hex:'#1C1C1C'}], images: ['https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&auto=format&fit=crop'], rating: 4.4, review_count: 76, is_featured: false, badge: null, stock: 65 },
  { id: '21', name: 'Tailored Suit Blazer', description: 'Sharp single-breasted blazer in premium wool-blend fabric. Notch lapel, two-button front, and interior pockets. The power move for any wardrobe.', price: 4999, original_price: 6999, category: 'Men', tags: ['formal'], sizes: ['S','M','L','XL'], colors: [{name:'Charcoal',hex:'#4A4A4A'},{name:'Navy',hex:'#1A3A5C'},{name:'Camel',hex:'#C68642'}], images: ['https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1503342452485-86f7b4a1b8d2?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6a8f2a3b50d1?w=1200&auto=format&fit=crop'], rating: 4.9, review_count: 64, is_featured: true, badge: 'Premium', stock: 18 },
  { id: '22', name: 'Boho Maxi Dress', description: 'Free-spirited maxi dress with tiered ruffle hem and embroidered neckline. 100% cotton voile, lightweight and breathable.', price: 2799, original_price: 3599, category: 'Women', tags: ['casual','summer'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Terracotta',hex:'#C8956C'},{name:'Sage',hex:'#8FBC8F'}], images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop'], rating: 4.8, review_count: 221, is_featured: false, badge: 'Trending', stock: 28 },
  { id: '23', name: 'Kids Puffer Jacket', description: 'Warm and cozy puffer jacket with a water-resistant outer shell and soft quilted fill. Zip-front with cozy collar. Easy to layer.', price: 1799, original_price: 2399, category: 'Kids', tags: ['casual'], sizes: ['2-3Y','4-5Y','6-7Y','8-9Y','10-11Y'], colors: [{name:'Coral',hex:'#FF7F6E'},{name:'Navy',hex:'#1A3A5C'}], images: ['https://images.unsplash.com/photo-1601063476271-a159c71ab0b3?w=800&auto=format&fit=crop'], rating: 4.7, review_count: 105, is_featured: false, badge: null, stock: 35 },
  { id: '24', name: 'Minimalist Watch Strap', description: 'Genuine Italian leather watch strap with a quick-release spring bar. Compatible with 18mm, 20mm, and 22mm lugs. Aged naturally over time.', price: 1199, original_price: null, category: 'Accessories', tags: ['formal','casual'], sizes: ['18mm','20mm','22mm'], colors: [{name:'Tan',hex:'#D2691E'},{name:'Black',hex:'#1C1C1C'},{name:'Cognac',hex:'#9B4722'}], images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&auto=format&fit=crop'], rating: 4.6, review_count: 53, is_featured: false, badge: null, stock: 70 },
  { id: '25', name: 'Linen Co-ord Set', description: 'Matching linen shirt and trouser set in a relaxed summer cut. Breathable, lightweight, and perfect for warm-weather occasions.', price: 3299, original_price: 4299, category: 'Men', tags: ['casual','summer','formal'], sizes: ['S','M','L','XL','XXL'], colors: [{name:'Ecru',hex:'#F0EAD6'},{name:'Powder Blue',hex:'#B0C4DE'}], images: ['https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1503342452485-86f7b4a1b8d2?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&auto=format&fit=crop'], rating: 4.7, review_count: 139, is_featured: true, badge: 'New', stock: 22 },
  { id: '26', name: 'Kantha Stitch Jacket', description: 'One-of-a-kind reversible jacket made from upcycled vintage saris with traditional kantha embroidery. Each piece is uniquely handcrafted by artisans in West Bengal.', price: 3999, original_price: null, category: 'Women', tags: ['formal','casual'], sizes: ['S','M','L','XL'], colors: [{name:'Multi',hex:'#C8956C'}], images: ['https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6b8f2a3b50d2?w=1200&auto=format&fit=crop'], rating: 5.0, review_count: 41, is_featured: true, badge: 'Artisan', stock: 12 },
  { id: '27', name: 'Corduroy Shirt Jacket', description: 'Casual corduroy overshirt with soft brushed finish. Layer it over tees or shirts for an elevated casual look.', price: 2199, original_price: 2999, category: 'Men', tags: ['casual','fall'], sizes: ['S','M','L','XL'], colors: [{name:'Olive',hex:'#6B8F5A'},{name:'Brown',hex:'#8B4513'}], images: ['https://images.unsplash.com/photo-1602810317679-37c2f0f9b8e7?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1542060748-6b6b4f9c9d2a?w=1200&auto=format&fit=crop'], rating: 4.5, review_count: 78, is_featured: false, badge: null, stock: 30 },
  { id: '28', name: 'Satin Slip Dress', description: 'Silky satin slip dress with bias cut for a flattering drape. Perfect for evening plans and summer nights.', price: 2699, original_price: 3699, category: 'Women', tags: ['evening','summer'], sizes: ['XS','S','M','L'], colors: [{name:'Champagne',hex:'#F5E6C8'},{name:'Black',hex:'#000000'}], images: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1544453280-7f0a9f2a9d9a?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1200&auto=format&fit=crop'], rating: 4.6, review_count: 102, is_featured: true, badge: 'New', stock: 18 },
  { id: '29', name: 'Kids Striped Shorts', description: 'Lightweight striped shorts with elastic waist for easy wear and play. Made from breathable cotton.', price: 499, original_price: 699, category: 'Kids', tags: ['summer','casual'], sizes: ['2-3Y','4-5Y','6-7Y','8-9Y'], colors: [{name:'Navy',hex:'#1A3A5C'}], images: ['https://images.unsplash.com/photo-1520975913164-6a8f2a3b50d1?w=1200&auto=format&fit=crop'], rating: 4.4, review_count: 34, is_featured: false, badge: null, stock: 75 },
  { id: '30', name: 'Recycled Cotton Tee', description: 'Eco-friendly tee made from recycled cotton blends. Soft, durable, and sustainably made.', price: 799, original_price: null, category: 'Men', tags: ['sustainable','casual'], sizes: ['S','M','L','XL','XXL'], colors: [{name:'Heather Grey',hex:'#DADADA'},{name:'Black',hex:'#000'}], images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&auto=format&fit=crop'], rating: 4.2, review_count: 46, is_featured: false, badge: null, stock: 120 },
  { id: '31', name: 'Puff Sleeve Blouse', description: 'Romantic puff-sleeve blouse with delicate pintucks and a buttoned front. Pairs beautifully with skirts and jeans.', price: 1599, original_price: 2199, category: 'Women', tags: ['casual','formal'], sizes: ['S','M','L','XL'], colors: [{name:'Ivory',hex:'#FFFFFF'},{name:'Dusty Rose',hex:'#E8C4C4'}], images: ['https://images.unsplash.com/photo-1520975913164-6b8f2a3b50d2?w=1200&auto=format&fit=crop'], rating: 4.3, review_count: 58, is_featured: false, badge: null, stock: 40 },
  { id: '32', name: 'Canvas Sneakers', description: 'Everyday canvas sneakers with cushioned insole and rubber outsole. Classic style that goes with everything.', price: 1999, original_price: 2499, category: 'Men', tags: ['footwear','casual'], sizes: ['6','7','8','9','10','11'], colors: [{name:'White',hex:'#FFFFFF'},{name:'Black',hex:'#000000'}], images: ['https://images.unsplash.com/photo-1519744792095-2f2205e87b6f?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520975913164-6a8f2a3b50d1?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&auto=format&fit=crop'], rating: 4.5, review_count: 210, is_featured: true, badge: 'Bestseller', stock: 60 },
  { id: '33', name: 'Wool Beanie', description: 'Soft wool beanie to keep you warm on chilly days. One size fits most.', price: 399, original_price: null, category: 'Accessories', tags: ['winter','casual'], sizes: ['One Size'], colors: [{name:'Charcoal',hex:'#4A4A4A'},{name:'Cream',hex:'#FFFDD0'}], images: ['https://images.unsplash.com/photo-1514996937319-344454492b37?w=1200&auto=format&fit=crop'], rating: 4.4, review_count: 29, is_featured: false, badge: null, stock: 150 },
  { id: '34', name: 'Lace Trim Camisole', description: 'Lightweight camisole with lace trim — ideal as a layering piece or worn alone.', price: 999, original_price: 1299, category: 'Women', tags: ['intimate','casual'], sizes: ['XS','S','M','L'], colors: [{name:'Nude',hex:'#F2D2B6'},{name:'Black',hex:'#000000'}], images: ['https://images.unsplash.com/photo-1542060748-6b6b4f9c9d2a?w=1200&auto=format&fit=crop'], rating: 4.1, review_count: 19, is_featured: false, badge: null, stock: 48 },
  { id: '35', name: 'Yoga Leggings', description: 'High-waisted yoga leggings with compressive stretch and sweat-wicking fabric. Perfect for workouts and lounging.', price: 1399, original_price: 1899, category: 'Women', tags: ['active','fitness'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Black',hex:'#000000'},{name:'Navy',hex:'#1A3A5C'}], images: ['https://images.unsplash.com/photo-1520975913164-6a8f2a3b50d1?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1495121605193-b116b5b09a27?w=1200&auto=format&fit=crop'], rating: 4.6, review_count: 84, is_featured: true, badge: 'Popular', stock: 65 },
  { id: '36', name: 'Suede Crossbody Bag', description: 'Compact suede crossbody bag with adjustable strap and brass hardware. Perfect for hands-free days.', price: 2499, original_price: 3299, category: 'Accessories', tags: ['casual','leather'], sizes: ['One Size'], colors: [{name:'Tan',hex:'#C68642'},{name:'Olive',hex:'#6B8F5A'}], images: ['https://images.unsplash.com/photo-1519744792095-2f2205e87b6f?w=1200&auto=format&fit=crop'], rating: 4.5, review_count: 47, is_featured: false, badge: null, stock: 25 },

  // ── NEW DRESSES ──────────────────────────────────────────────
  { id: '37', name: 'Ivory Lace Midi Dress', description: 'Romantic ivory midi dress in soft cotton lace. Fitted bodice, flared skirt with delicate scalloped hem. Lined for comfort. Perfect for garden parties, brunches, and festive occasions.', price: 3199, original_price: 4299, category: 'Women', tags: ['formal','casual','summer','evening'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Ivory',hex:'#FFFFF0'},{name:'Blush',hex:'#FFB6C1'}], images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&auto=format&fit=crop'], rating: 4.8, review_count: 214, is_featured: true, badge: 'Bestseller', stock: 28 },

  { id: '38', name: 'Rust Tiered Sundress', description: 'Breezy tiered sundress in earthy rust cotton. Adjustable spaghetti straps, smocked back for a perfect fit. Three ruffled tiers that move beautifully as you walk.', price: 1899, original_price: 2599, category: 'Women', tags: ['summer','casual'], sizes: ['XS','S','M','L','XL','XXL'], colors: [{name:'Rust',hex:'#B7410E'},{name:'Terracotta',hex:'#C8956C'},{name:'Mustard',hex:'#FFDB58'}], images: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1503342452485-86f7b4a1b8d2?w=1200&auto=format&fit=crop'], rating: 4.7, review_count: 178, is_featured: true, badge: 'New', stock: 42 },

  { id: '39', name: 'Midnight Velvet Gown', description: 'Luxurious floor-length velvet gown in deep midnight blue. Off-shoulder neckline, fitted bodice, and a subtle side slit. Fully lined with a concealed back zipper. Made for occasions worth remembering.', price: 5999, original_price: 7999, category: 'Women', tags: ['formal','evening'], sizes: ['XS','S','M','L'], colors: [{name:'Midnight Blue',hex:'#191970'},{name:'Emerald',hex:'#50C878'},{name:'Burgundy',hex:'#800020'}], images: ['https://images.unsplash.com/photo-1566479179817-0b9a4a2e7f5c?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop'], rating: 4.9, review_count: 93, is_featured: true, badge: 'Premium', stock: 14 },

  { id: '40', name: 'Sage Green Shirt Dress', description: 'Effortlessly chic shirt dress in washed sage linen. Oversized collar, belted waist, and knee-length hem. Wear it buttoned up as a dress or open as a duster over jeans.', price: 2299, original_price: null, category: 'Women', tags: ['casual','formal','summer'], sizes: ['S','M','L','XL'], colors: [{name:'Sage',hex:'#8FBC8F'},{name:'Sand',hex:'#C2B280'},{name:'White',hex:'#FAFAFA'}], images: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop'], rating: 4.6, review_count: 156, is_featured: true, badge: null, stock: 35 },

  { id: '41', name: 'Indigo Block Print Anarkali', description: 'Stunning hand block-printed Anarkali in deep indigo with ivory motifs. Floor-sweeping flare, three-quarter sleeves, and subtle gold gota trim at the hem. Paired with matching churidar.', price: 4499, original_price: 5999, category: 'Women', tags: ['formal','ethnic','festive'], sizes: ['S','M','L','XL','XXL'], colors: [{name:'Indigo',hex:'#4B0082'},{name:'Deep Red',hex:'#8B0000'}], images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1491897554428-130a60dd4757?w=1200&auto=format&fit=crop'], rating: 4.9, review_count: 267, is_featured: true, badge: 'Bestseller', stock: 20 },

  { id: '42', name: 'Candy Stripe Wrap Dress', description: 'Playful candy-stripe wrap dress in lightweight viscose. V-neckline, tie waist, and flutter sleeves. The cinched silhouette flatters every figure. A wardrobe essential for warm days.', price: 1999, original_price: 2799, category: 'Women', tags: ['casual','summer'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Red Stripe',hex:'#CC3333'},{name:'Blue Stripe',hex:'#1A3A5C'},{name:'Pink Stripe',hex:'#FFB6C1'}], images: ['https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&auto=format&fit=crop'], rating: 4.5, review_count: 132, is_featured: false, badge: 'Sale', stock: 50 },

  { id: '43', name: 'Chocolate Cowl Neck Dress', description: 'Sophisticated cowl-neck midi dress in buttery soft chocolate jersey. Draped neckline, long sleeves, and a subtle A-line silhouette. Effortlessly transitions from office to dinner.', price: 2799, original_price: 3599, category: 'Women', tags: ['formal','casual','evening'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Chocolate',hex:'#7B3F00'},{name:'Charcoal',hex:'#4A4A4A'},{name:'Camel',hex:'#C68642'}], images: ['https://images.unsplash.com/photo-1551803091-e20673f15770?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1594938298603-c8148c4b4ac0?w=1200&auto=format&fit=crop'], rating: 4.7, review_count: 189, is_featured: true, badge: null, stock: 30 },

  { id: '44', name: 'White Cotton Broderie Dress', description: 'Summer-perfect broderie anglaise dress in crisp white cotton. Square neckline with delicate eyelet detailing, elasticated waist, and a mid-calf length. Feels as good as it looks.', price: 2199, original_price: 2999, category: 'Women', tags: ['casual','summer','boho'], sizes: ['XS','S','M','L','XL'], colors: [{name:'White',hex:'#FFFFFF'},{name:'Ecru',hex:'#F0EAD6'}], images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1485462537746-965f33f4f4c2?w=1200&auto=format&fit=crop'], rating: 4.6, review_count: 201, is_featured: false, badge: 'New', stock: 38 },

  { id: '45', name: 'Emerald Pleat Midi Dress', description: 'Show-stopping emerald green dress with deep pleats from the waist down. Halter neckline, open back with a tie detail, and knee-length hem. In a luxurious satin-crepe fabric.', price: 3499, original_price: 4799, category: 'Women', tags: ['evening','formal'], sizes: ['XS','S','M','L'], colors: [{name:'Emerald',hex:'#50C878'},{name:'Cobalt',hex:'#0047AB'},{name:'Fuchsia',hex:'#FF00FF'}], images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1566479179817-0b9a4a2e7f5c?w=1200&auto=format&fit=crop'], rating: 4.8, review_count: 117, is_featured: true, badge: 'Trending', stock: 18 },

  { id: '46', name: 'Pastel Ombre Kaftan Dress', description: 'Free-flowing kaftan dress in dreamy pastel ombre chiffon — shifting from lilac to peach to coral. One-size-fits-most design with wide sleeves and a relaxed silhouette. Resort-ready elegance.', price: 2599, original_price: null, category: 'Women', tags: ['summer','boho','casual'], sizes: ['S/M','L/XL','XXL/3XL'], colors: [{name:'Lilac-Peach',hex:'#DDA0DD'},{name:'Sky-Mint',hex:'#87CEEB'}], images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop'], rating: 4.5, review_count: 88, is_featured: false, badge: null, stock: 55 },

  { id: '47', name: 'Black Off-Shoulder Mini', description: 'Timeless little black dress with an off-shoulder neckline and a figure-hugging bodycon silhouette. Thick elasticated neckline, above-knee length. A classic that belongs in every wardrobe.', price: 1799, original_price: 2499, category: 'Women', tags: ['evening','casual','formal'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Black',hex:'#000000'},{name:'Deep Red',hex:'#8B0000'}], images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b4ac0?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1551803091-e20673f15770?w=1200&auto=format&fit=crop'], rating: 4.7, review_count: 334, is_featured: true, badge: 'Bestseller', stock: 60 },

  { id: '48', name: 'Printed Palazzo Jumpsuit', description: 'Breezy wide-leg palazzo jumpsuit in an abstract floral print on ivory. Sleeveless with a deep V, cinched waist, and flowing legs. Wear it day to night with just a swap of footwear.', price: 2899, original_price: 3799, category: 'Women', tags: ['casual','formal','summer'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Ivory Print',hex:'#F0EAD6'},{name:'Black Print',hex:'#1C1C1C'}], images: ['https://images.unsplash.com/photo-1495121605193-b116b5b09a27?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=1200&auto=format&fit=crop'], rating: 4.6, review_count: 143, is_featured: false, badge: 'New', stock: 25 },

  { id: '49', name: 'Cherry Blossom Maxi', description: 'Ethereal maxi dress with an all-over cherry blossom print on a blush base. Floaty chiffon fabric, sweetheart neckline, adjustable spaghetti straps, and a gorgeous wide skirt that catches every breeze.', price: 3299, original_price: 4499, category: 'Women', tags: ['summer','boho','casual'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Blush Floral',hex:'#FFB6C1'},{name:'Lavender Floral',hex:'#DDA0DD'}], images: ['https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=1200&auto=format&fit=crop'], rating: 4.8, review_count: 256, is_featured: true, badge: 'Trending', stock: 32 },

  { id: '50', name: 'Bandhani Shift Dress', description: 'Traditional Rajasthani bandhani tie-dye on a breezy cotton shift dress. Each piece is unique — no two are exactly alike. Round neckline, short sleeves, and knee-length silhouette. Handcrafted with natural dyes.', price: 1699, original_price: 2299, category: 'Women', tags: ['casual','ethnic','summer'], sizes: ['S','M','L','XL'], colors: [{name:'Magenta',hex:'#FF00B4'},{name:'Saffron',hex:'#FF8C00'},{name:'Teal',hex:'#008080'}], images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1499939667766-4afceb292d05?w=1200&auto=format&fit=crop'], rating: 4.9, review_count: 182, is_featured: true, badge: 'Artisan', stock: 22 },

  { id: '51', name: 'Dusty Rose Balloon Dress', description: 'Fashion-forward balloon midi dress in dusty rose taffeta. Structured puff sleeves, nipped-in waist, and a voluminous skirt that makes a statement. Fully lined. Button back closure.', price: 3799, original_price: 4999, category: 'Women', tags: ['formal','evening'], sizes: ['XS','S','M','L'], colors: [{name:'Dusty Rose',hex:'#DCAE96'},{name:'Lilac',hex:'#DDA0DD'},{name:'Powder Blue',hex:'#B0C4DE'}], images: ['https://images.unsplash.com/photo-1551803091-e20673f15770?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1200&auto=format&fit=crop'], rating: 4.7, review_count: 74, is_featured: false, badge: 'New', stock: 16 },

  { id: '52', name: 'Denim Pinafore Dress', description: 'Cool and casual denim pinafore dress with adjustable straps and two front pockets. Wear it over a tee or a ribbed turtleneck for layered looks. Mid-thigh length, relaxed fit.', price: 1499, original_price: 1999, category: 'Women', tags: ['casual'], sizes: ['XS','S','M','L','XL'], colors: [{name:'Light Denim',hex:'#6FA8DC'},{name:'Dark Denim',hex:'#2C4A7C'}], images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&auto=format&fit=crop'], rating: 4.4, review_count: 121, is_featured: false, badge: null, stock: 48 },

  { id: '53', name: 'Gold Tissue Lehenga Set', description: 'Opulent tissue lehenga set with intricate zari weave throughout. Includes a crop blouse with back tie, a fully flared lehenga skirt, and a matching dupatta. Ideal for weddings and pujas.', price: 8999, original_price: 11999, category: 'Women', tags: ['festive','ethnic','formal'], sizes: ['S','M','L','XL'], colors: [{name:'Gold',hex:'#FFD700'},{name:'Rose Gold',hex:'#B76E79'}], images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop'], rating: 5.0, review_count: 59, is_featured: true, badge: 'Premium', stock: 10 },

  { id: '54', name: 'Olive Utility Shirt Dress', description: 'Utilitarian shirt dress in olive cotton-twill. Chest patch pockets, utility belt loops, and a button-front placket. Knee-length with a relaxed straight fit. Goes everywhere, needs nothing.', price: 1999, original_price: null, category: 'Women', tags: ['casual','formal'], sizes: ['S','M','L','XL','XXL'], colors: [{name:'Olive',hex:'#6B7C3A'},{name:'Khaki',hex:'#C3B091'},{name:'Black',hex:'#1C1C1C'}], images: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop'], rating: 4.5, review_count: 163, is_featured: false, badge: null, stock: 44 },

  { id: '55', name: 'Teal Asymmetric Hem Dress', description: 'Contemporary asymmetric dress in teal crepe — shorter at the front, flowing long at the back. Sleeveless, with a draped cowl neckline and a wide structured waistband. A head-turner for sure.', price: 2999, original_price: 3999, category: 'Women', tags: ['evening','formal'], sizes: ['XS','S','M','L'], colors: [{name:'Teal',hex:'#008080'},{name:'Plum',hex:'#DDA0DD'},{name:'Coral',hex:'#FF7F50'}], images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1566479179817-0b9a4a2e7f5c?w=1200&auto=format&fit=crop'], rating: 4.6, review_count: 98, is_featured: false, badge: 'Trending', stock: 20 },

  { id: '56', name: 'Hand-Painted Silk Dress', description: 'One-of-a-kind wearable art — a pure silk midi dress hand-painted by artisans in Jaipur. Abstract watercolour florals in soft blues and greens. Fluid bias cut, V-neckline, and concealed side zip. Each piece is unique.', price: 6499, original_price: null, category: 'Women', tags: ['formal','evening','artisan','summer'], sizes: ['S','M','L','XL'], colors: [{name:'Blue Watercolour',hex:'#87CEEB'},{name:'Rose Watercolour',hex:'#FFB6C1'}], images: ['https://images.unsplash.com/photo-1485462537746-965f33f4f4c2?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1499939667766-4afceb292d05?w=1200&auto=format&fit=crop'], rating: 5.0, review_count: 38, is_featured: true, badge: 'Artisan', stock: 8 }
];

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  updateBadges();
  setupNavScroll();
  setupAuthListener();
  await loadProducts();
  renderFeaturedProducts();
  renderShopProducts();
  // restore compact view preference (if any)
  try {
    const compact = localStorage.getItem('shopCompact') === '1';
    if (compact) {
      const grid = document.getElementById('shop-products');
      if (grid) grid.classList.add('compact');
      const btn = document.getElementById('view-compact');
      if (btn) btn.classList.add('active');
    }
  } catch (e) { /* ignore localStorage errors */ }
  renderWishlistPage();
  renderCheckoutSummary();
  if (typeof initFeatures === 'function') initFeatures();
});

function toggleCompactView() {
  const grid = document.getElementById('shop-products');
  const btn = document.getElementById('view-compact');
  if (!grid) return;
  const enabled = grid.classList.toggle('compact');
  if (btn) btn.classList.toggle('active', enabled);
  try { localStorage.setItem('shopCompact', enabled ? '1' : '0'); } catch (e) {/* ignore */}
}

async function loadProducts() {
  try {
    // If SUPABASE_URL is not a valid Supabase project URL, fall back to demo products.
    // Valid Supabase project URLs look like: https://<project_ref>.supabase.co
    const isValidSupabaseUrl = typeof SUPABASE_URL === 'string' && /https?:\/\/[^\s]+\.supabase\.co/.test(SUPABASE_URL);
    if (!isValidSupabaseUrl) {
      allProducts = DEMO_PRODUCTS;
    } else {
      let productsFromDb = await Products.getAll();
      // Normalize images field to always be an array of URLs so the UI can rely on p.images[0]
      function normalizeProduct(p) {
        const np = { ...p };
        let imgs = np.images;
        if (!imgs) imgs = [];
        else if (typeof imgs === 'string') {
          // Try parse JSON first (some setups store as JSON string), otherwise split by comma
          try { imgs = JSON.parse(imgs); } catch (e) { imgs = String(imgs).split(',').map(s => s.trim()).filter(Boolean); }
        } else if (!Array.isArray(imgs)) {
          imgs = [imgs];
        }
        np.images = imgs;
        return np;
      }

      allProducts = (productsFromDb || []).map(normalizeProduct);
      if (!allProducts.length) allProducts = DEMO_PRODUCTS;
    }
    filteredProducts = [...allProducts];
  } catch (e) {
    console.warn('Using demo products:', e.message);
    allProducts = DEMO_PRODUCTS;
    filteredProducts = [...allProducts];
  }
}

// ============================================================
//  NAVIGATION
// ============================================================
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) { target.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  if (page === 'shop') applyFilters();
  if (page === 'wishlist') renderWishlistPage();
  if (page === 'checkout') renderCheckoutSummary();
  if (page === 'orders') renderOrdersPage();
  if (page === 'profile') renderProfilePage();
}

function setupNavScroll() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });
}

function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
  const backdrop = document.getElementById('mobile-menu-backdrop');
  if (backdrop) backdrop.classList.toggle('open');
}

// ============================================================
//  AUTH
// ============================================================
function setupAuthListener() {
  try {
    Auth.onAuthStateChange((event, session) => {
      currentUser = session?.user || null;
      updateAuthUI();
      // When the user clicks the password-reset email link, Supabase fires
      // PASSWORD_RECOVERY — open the reset panel automatically.
      if (event === 'PASSWORD_RECOVERY') {
        openAuthModal('reset');
      }
    });
  } catch (e) {}
}

function updateAuthUI() {
  const dot = document.getElementById('auth-avatar-dot');
  const ddGuest = document.getElementById('profile-dd-guest');
  const ddUser = document.getElementById('profile-dd-user');

  if (currentUser) {
    // Show green dot on avatar
    if (dot) dot.style.display = 'block';

    // Fill dropdown user info
    const meta = currentUser.user_metadata || {};
    const name = meta.full_name || meta.name || currentUser.email?.split('@')[0] || 'User';
    const email = currentUser.email || '';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const pdName = document.getElementById('pd-user-name');
    const pdEmail = document.getElementById('pd-user-email');
    const pdAvatar = document.getElementById('pd-avatar-initials');
    if (pdName) pdName.textContent = name;
    if (pdEmail) pdEmail.textContent = email;
    if (pdAvatar) pdAvatar.textContent = initials;

    if (ddGuest) ddGuest.style.display = 'none';
    if (ddUser) ddUser.style.display = 'block';
  } else {
    if (dot) dot.style.display = 'none';
    if (ddGuest) ddGuest.style.display = 'block';
    if (ddUser) ddUser.style.display = 'none';
  }
}

function toggleProfileDropdown() {
  const dd = document.getElementById('profile-dropdown');
  if (!dd) return;
  const isOpen = dd.style.display === 'block';
  dd.style.display = isOpen ? 'none' : 'block';
}

function closeProfileDropdown() {
  const dd = document.getElementById('profile-dropdown');
  if (dd) dd.style.display = 'none';
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  const wrap = document.getElementById('profile-dropdown-wrap');
  if (wrap && !wrap.contains(e.target)) closeProfileDropdown();
});

function toggleAuth() {
  openAuthModal('login');
}

function openAuthModal(tab) {
  closeProfileDropdown();
  document.getElementById('auth-modal').classList.add('open');
  switchAuthTab(tab, document.getElementById('tab-' + tab));
}

function closeAuth() {
  document.getElementById('auth-modal').classList.remove('open');
}

function switchAuthTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  const tabs = ['login', 'signup', 'forgot', 'reset'];
  tabs.forEach(t => {
    const el = document.getElementById(t + '-form');
    if (el) el.style.display = 'none';
  });
  const active = document.getElementById(tab + '-form');
  if (active) active.style.display = 'block';
  if (btn) btn.classList.add('active');
  else {
    const el = document.getElementById('tab-' + tab);
    if (el) el.classList.add('active');
  }
}

async function loginUser() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const msg = document.getElementById('login-msg');
  const btn = document.querySelector('#login-form .btn-primary');
  if (!email || !password) { showMsg(msg, 'Please fill all fields.', 'error'); return; }
  if (btn) { btn.textContent = 'Signing in...'; btn.disabled = true; }
  try {
    const { data, error } = await Auth.signIn(email, password);
    if (error) throw error;
    currentUser = data.user;
    updateAuthUI();
    showMsg(msg, 'Welcome back! ✓', 'success');
    setTimeout(() => {
      closeAuth();
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';
      msg.textContent = '';
    }, 800);
    showToast('Signed in successfully! 👋', 'success');
  } catch (e) {
    showMsg(msg, e.message || 'Login failed. Check your email & password.', 'error');
  } finally {
    if (btn) { btn.textContent = 'Sign In'; btn.disabled = false; }
  }
}

async function signupUser() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const msg = document.getElementById('signup-msg');
  const btn = document.querySelector('#signup-form .btn-primary');
  if (!name || !email || !password) { showMsg(msg, 'Please fill all fields.', 'error'); return; }
  if (password.length < 6) { showMsg(msg, 'Password must be at least 6 characters.', 'error'); return; }
  if (btn) { btn.textContent = 'Creating...'; btn.disabled = true; }
  try {
    const { data, error } = await Auth.signUp(email, password, name);
    if (error) throw error;
    // If session exists, user is auto-confirmed
    if (data.session) {
      currentUser = data.user;
      updateAuthUI();
      showMsg(msg, 'Account created! Welcome to DRAPE ✓', 'success');
      setTimeout(() => {
        closeAuth();
        document.getElementById('signup-name').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
        msg.textContent = '';
      }, 800);
      showToast('Account created! Welcome 🎉', 'success');
    } else {
      // Supabase requires email confirmation — tell the user clearly
      showMsg(msg, '✉️ Almost there! We sent a verification link to ' + email + '. Please check your inbox (and spam folder) and click the link to activate your account.', 'success');
    }
  } catch (e) {
    showMsg(msg, e.message || 'Signup failed. Try again.', 'error');
  } finally {
    if (btn) { btn.textContent = 'Create Account'; btn.disabled = false; }
  }
}

async function logoutUser() {
  try { await Auth.signOut(); } catch (e) {}
  currentUser = null;
  wishlist = [];
  localStorage.removeItem('drape_wishlist_ids');
  updateAuthUI();
  updateBadges();
  showPage('home');
  showToast('Signed out. See you soon! 👋');
}

// ── Forgot / Reset password ───────────────────────────────────
async function sendPasswordReset() {
  const email = document.getElementById('forgot-email').value.trim();
  const msg = document.getElementById('forgot-msg');
  const btn = document.querySelector('#forgot-form .btn-primary');
  if (!email) { showMsg(msg, 'Please enter your email address.', 'error'); return; }
  if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }
  try {
    const { error } = await Auth.forgotPassword(email);
    if (error) throw error;
    showMsg(msg, '✉️ Reset link sent! Check your inbox (and spam folder).', 'success');
    document.getElementById('forgot-email').value = '';
  } catch (e) {
    showMsg(msg, e.message || 'Failed to send reset email. Try again.', 'error');
  } finally {
    if (btn) { btn.textContent = 'Send Reset Link'; btn.disabled = false; }
  }
}

async function submitPasswordReset() {
  const np = document.getElementById('reset-new-pass').value;
  const cp = document.getElementById('reset-confirm-pass').value;
  const msg = document.getElementById('reset-msg');
  const btn = document.querySelector('#reset-form .btn-primary');
  if (!np || !cp) { showMsg(msg, 'Please fill both fields.', 'error'); return; }
  if (np.length < 6) { showMsg(msg, 'Password must be at least 6 characters.', 'error'); return; }
  if (np !== cp) { showMsg(msg, 'Passwords do not match.', 'error'); return; }
  if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }
  try {
    const { error } = await Auth.updatePassword(np);
    if (error) throw error;
    showMsg(msg, 'Password updated! ✓ You can now sign in.', 'success');
    document.getElementById('reset-new-pass').value = '';
    document.getElementById('reset-confirm-pass').value = '';
    showToast('Password reset successful! 🎉', 'success');
    // Clean URL and switch to login tab after a short delay
    setTimeout(() => {
      history.replaceState({}, '', window.location.pathname);
      switchAuthTab('login');
    }, 1800);
  } catch (e) {
    showMsg(msg, e.message || 'Failed to reset password. The link may have expired.', 'error');
  } finally {
    if (btn) { btn.textContent = 'Set New Password'; btn.disabled = false; }
  }
}

// If the user lands on the page via a password-reset link (?reset=1),
// open the auth modal straight to the reset-password tab.
(function handleResetRedirect() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('reset') === '1') {
    // Supabase puts the session in the URL fragment; it is picked up
    // automatically by the SDK — we just need to show the UI.
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => openAuthModal('reset'), 600);
    });
  }
})();

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'auth-msg ' + (type || '');
}

// ============================================================
//  SEARCH
// ============================================================
function toggleSearch() {
  document.getElementById('search-overlay').classList.toggle('open');
  if (document.getElementById('search-overlay').classList.contains('open')) {
    setTimeout(() => document.getElementById('search-input').focus(), 200);
  }
}

async function searchProducts(query) {
  const container = document.getElementById('search-results');
  if (!query.trim()) { container.innerHTML = ''; return; }
  let results;
  try {
    if (!SUPABASE_URL.includes('YOUR_PROJECT_REF')) {
      results = await Products.search(query);
    } else {
      const q = query.toLowerCase();
      results = allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
  } catch (e) {
    results = allProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  }
  container.innerHTML = results.slice(0, 5).map(p => `
    <div class="search-result-item" onclick="openProduct('${p.id}'); toggleSearch();">
  <img class="search-result-img" loading="lazy" src="${p.images?.[0] || getPlaceholderSrc(120,160,'DRAPE')}" alt="${p.name}" data-images='${JSON.stringify(p.images || [])}' data-img-idx="0" onerror="handleImageError(this)"/>
      <div class="search-result-info">
        <h4>${p.name}</h4>
        <p class="search-result-caption">${(p.description || '').length > 80 ? (p.description || '').slice(0,80) + '…' : (p.description || '')}</p>
        <p>${APP_CONFIG.currencySymbol}${p.price.toLocaleString('en-IN')}</p>
      </div>
    </div>
  `).join('') || '<p style="color:var(--muted);font-size:13px">No results found.</p>';
}

// ============================================================
//  PRODUCTS — RENDERING
// ============================================================
function createProductCard(product) {
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100) : null;
  const isWished = wishlist.includes(product.id);

  return `
    <div class="product-card" data-id="${product.id}">
      <div class="product-card-img-wrap" onclick="openProduct('${product.id}')">
        ${product.badge ? `<div class="product-badge ${product.badge === 'New' ? 'new' : ''}">${product.badge}</div>` : ''}
        ${discount ? `<div class="product-badge" style="top:auto;bottom:1rem;background:var(--error)">-${discount}%</div>` : ''}
        <img class="product-card-img" src="${product.images?.[0] || getPlaceholderSrc(400,530,'DRAPE')}" alt="${product.name}" loading="lazy" data-images='${JSON.stringify(product.images || [])}' data-img-idx="0" onerror="handleImageError(this)" />
        <div class="product-card-overlay">
          <button class="overlay-btn add" onclick="event.stopPropagation(); quickAddToCart('${product.id}')">Add to Cart</button>
          <button class="overlay-btn wish ${isWished ? 'wished' : ''}" onclick="event.stopPropagation(); toggleWishlist('${product.id}')" title="Wishlist">
            ${isWished ? '♥' : '♡'}
          </button>
        </div>
      </div>
      <div class="product-card-info" onclick="openProduct('${product.id}')">
        <div class="category">${product.category}</div>
        <h3>${product.name}</h3>
        <p class="product-caption">${(product.description || '').length > 90 ? (product.description || '').slice(0,90) + '…' : (product.description || '')}</p>
        <div class="product-price">
          <span class="price">${APP_CONFIG.currencySymbol}${product.price.toLocaleString('en-IN')}</span>
          ${product.original_price ? `<span class="original">${APP_CONFIG.currencySymbol}${product.original_price.toLocaleString('en-IN')}</span>` : ''}
        </div>
        <div class="product-rating">
          <span class="stars">${'★'.repeat(Math.round(product.rating))}${'☆'.repeat(5 - Math.round(product.rating))}</span>
          <span>${product.rating} (${product.review_count})</span>
        </div>
      </div>
    </div>
  `;
}

function renderFeaturedProducts() {
  const container = document.getElementById('featured-products');
  const featured = allProducts.filter(p => p.is_featured).slice(0, 8);
  container.innerHTML = featured.map(createProductCard).join('');
}

function renderShopProducts() {
  const container = document.getElementById('shop-products');
  const toShow = filteredProducts.slice(0, displayedCount);
  container.innerHTML = toShow.length ? toShow.map(createProductCard).join('') :
    '<div class="empty-state" style="grid-column:1/-1"><p>No products match your filters.</p></div>';
  document.getElementById('product-count').textContent = `Showing ${toShow.length} of ${filteredProducts.length} products`;
  document.getElementById('load-more-btn').style.display = filteredProducts.length > displayedCount ? 'inline-block' : 'none';
}

function loadMoreProducts() {
  displayedCount += 8;
  renderShopProducts();
}

function setGridView(cols) {
  const grid = document.getElementById('shop-products');
  grid.className = 'products-grid' + (cols === 2 ? ' cols-2' : '');
  document.getElementById('view-4').classList.toggle('active', cols === 4);
  document.getElementById('view-2').classList.toggle('active', cols === 2);
}

// ============================================================
//  FILTERS
// ============================================================
function applyFilters() {
  const catEl = document.querySelector('input[name="cat"]:checked');
  const ratingEl = document.querySelector('input[name="rating"]:checked');
  const sortEl = document.getElementById('sort-select');
  if (catEl) activeCategory = catEl.value;
  if (ratingEl) activeRating = parseFloat(ratingEl.value);
  if (sortEl) activeSort = sortEl.value;

  filteredProducts = allProducts.filter(p => {
    const catMatch = activeCategory === 'All' || p.category === activeCategory;
    const priceMatch = p.price <= priceLimit;
    const ratingMatch = p.rating >= activeRating;
    return catMatch && priceMatch && ratingMatch;
  });

  if (activeSort === 'price-asc') filteredProducts.sort((a, b) => a.price - b.price);
  else if (activeSort === 'price-desc') filteredProducts.sort((a, b) => b.price - a.price);
  else if (activeSort === 'name-asc') filteredProducts.sort((a, b) => a.name.localeCompare(b.name));

  displayedCount = 8;
  renderShopProducts();
}

function updatePriceFilter(val) {
  priceLimit = parseInt(val);
  document.getElementById('price-val').textContent = parseInt(val).toLocaleString('en-IN');
  applyFilters();
}

function filterByCategory(cat) {
  activeCategory = cat;
  showPage('shop');
  const radio = document.querySelector(`input[name="cat"][value="${cat}"]`);
  if (radio) { radio.checked = true; applyFilters(); }
}

function filterByDiscount() {
  filteredProducts = allProducts.filter(p => p.original_price);
  displayedCount = 8;
  showPage('shop');
  renderShopProducts();
}

function filterByTag(tag) {
  filteredProducts = allProducts.filter(p => p.tags && p.tags.includes(tag));
  displayedCount = 8;
  showPage('shop');
  renderShopProducts();
}

// ============================================================
//  PRODUCT DETAIL
// ============================================================
function openProduct(id) {
  const product = allProducts.find(p => p.id == id || p.id === id);
  if (!product) return;
  currentProduct = product;
  selectedSize = null;
  selectedColor = null;
  selectedQty = 1;
  trackRecentlyViewed(id);
  renderProductDetail(product);
  showPage('product');
}

function renderProductDetail(product) {
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100) : null;
  const colors = product.colors || [];
  const sizes = product.sizes || ['S','M','L','XL'];

  const html = `
    <div class="detail-gallery">
    <img class="detail-main-img" id="main-img" src="${product.images?.[0] || getPlaceholderSrc(400,530,'DRAPE')}" alt="${product.name}" data-images='${JSON.stringify(product.images || [])}' data-img-idx="0" onerror="handleImageError(this)" onmouseleave="resetZoom()" />
      <div class="detail-thumbs">
        ${(product.images || []).slice(0, 4).map((img, i) => `
          <img class="detail-thumb ${i === 0 ? 'active' : ''}" loading="lazy" src="${img || getPlaceholderSrc(120,160,'DRAPE')}" data-images='${JSON.stringify(product.images || [])}' data-img-idx="${i}" onclick="changeMainImg(this, '${img || getPlaceholderSrc(120,160,'DRAPE')}')" alt="View ${i+1}" onerror="handleImageError(this)" />
        `).join('')}
      </div>
    </div>
    <div class="detail-info">
      <div class="breadcrumb">
        <a onclick="showPage('home')">Home</a> &rsaquo; 
        <a onclick="filterByCategory('${product.category}')">${product.category}</a> &rsaquo; 
        ${product.name}
      </div>
      ${product.badge ? `<div class="product-badge" style="position:static;display:inline-block;margin-bottom:0.75rem">${product.badge}</div>` : ''}
      <h1>${product.name}</h1>
      <div class="detail-price">
        ${APP_CONFIG.currencySymbol}${product.price.toLocaleString('en-IN')}
        ${product.original_price ? `<span class="detail-original">&nbsp;&nbsp;${APP_CONFIG.currencySymbol}${product.original_price.toLocaleString('en-IN')}</span>` : ''}
        ${discount ? `&nbsp;<span style="color:var(--error);font-size:1rem">(-${discount}%)</span>` : ''}
      </div>
      <div class="detail-rating">
        <span class="stars">${'★'.repeat(Math.round(product.rating))}${'☆'.repeat(5-Math.round(product.rating))}</span>
        <span>${product.rating} · ${product.review_count} reviews</span>
      </div>
      <p class="detail-desc">${product.description || ''}</p>

      ${colors.length ? `
        <span class="color-label">Color: <strong id="selected-color-name">${colors[0]?.name || ''}</strong></span>
        <div class="color-options">
          ${colors.map((c, i) => `
            <div class="color-swatch ${i === 0 ? 'active' : ''}" 
              style="background:${c.hex};${c.hex === '#FFFFFF' || c.hex === '#FAFAFA' ? 'border:1px solid #ccc;' : ''}"
              onclick="selectColor(this, '${c.name}')" title="${c.name}"></div>
          `).join('')}
        </div>
      ` : ''}

      <span class="size-label">Size:</span>
      <div class="size-options">
        ${sizes.map(s => `<button class="size-btn" onclick="selectSize(this, '${s}')">${s}</button>`).join('')}
      </div>
      <a href="#" style="font-size:12px;color:var(--muted);text-decoration:underline;display:block;margin-top:-0.75rem;margin-bottom:1.5rem" onclick="openSizeGuide('${product.category}'); return false;">📏 Size Guide</a>

      <div class="detail-actions">
        <div class="detail-qty">
          <button onclick="changeDetailQty(-1)">−</button>
          <span id="detail-qty-val">1</span>
          <button onclick="changeDetailQty(1)">+</button>
        </div>
        <button class="btn-primary" style="flex:1" onclick="addCurrentProductToCart()">Add to Cart</button>
        <button class="btn-outline" onclick="toggleWishlist('${product.id}')" id="detail-wish-btn">
          ${wishlist.includes(product.id) ? '♥ Saved' : '♡ Wishlist'}
        </button>
        <button class="btn-outline" onclick="toggleCompare('${product.id}')" title="Compare">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </button>
      </div>

      <div class="detail-features">
        <div class="detail-feature">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Free shipping on orders above ${APP_CONFIG.currencySymbol}${APP_CONFIG.freeShippingThreshold}
        </div>
        <div class="detail-feature">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          Easy 30-day returns
        </div>
        <div class="detail-feature">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          Delivered in 3–5 business days
        </div>
      </div>
    </div>
  `;
  document.getElementById('product-detail-content').innerHTML = html;
  // Add reviews below
  document.getElementById('product-detail-content').insertAdjacentHTML('beforeend',
    `<div style="grid-column:1/-1;margin-top:3rem;padding-top:2rem;border-top:1px solid var(--border)">${renderReviews(product.id)}</div>
     <div id="recently-viewed-section" style="grid-column:1/-1;margin-top:3rem">
       <div class="section-header"><h2>Recently Viewed</h2></div>
       <div class="products-grid" id="recently-viewed-grid"></div>
     </div>`
  );
  // Auto-select first color
  if (colors.length) selectedColor = colors[0].name;
  renderRecentlyViewed();
}

function changeMainImg(el, src) {
  document.getElementById('main-img').src = src;
  document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function selectSize(el, size) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  selectedSize = size;
}

function selectColor(el, colorName) {
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  selectedColor = colorName;
  const nameEl = document.getElementById('selected-color-name');
  if (nameEl) nameEl.textContent = colorName;
}

function changeDetailQty(delta) {
  selectedQty = Math.max(1, Math.min(10, selectedQty + delta));
  document.getElementById('detail-qty-val').textContent = selectedQty;
}

function addCurrentProductToCart() {
  if (!currentProduct) return;
  if (!selectedSize) { showToast('Please select a size.', 'error'); return; }
  addToCart(currentProduct, selectedQty, selectedSize, selectedColor);
  openCart();
}

function quickAddToCart(id) {
  const product = allProducts.find(p => p.id == id);
  if (!product) return;
  const size = product.sizes?.[1] || product.sizes?.[0] || 'M';
  const color = product.colors?.[0]?.name || null;
  addToCart(product, 1, size, color);
}

// ============================================================
//  CART
// ============================================================
function addToCart(product, qty = 1, size = null, color = null) {
  const key = `${product.id}-${size}-${color}`;
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty = Math.min(10, existing.qty + qty);
  } else {
    cart.push({
      key, id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || getPlaceholderSrc(120,160,'DRAPE'),
      size, color, qty
    });
  }
  saveCart();
  showToast(`${product.name} added to cart!`, 'success');
  renderCart();
}

function removeFromCart(key) {
  cart = cart.filter(i => i.key !== key);
  saveCart();
  renderCart();
}

function updateCartQty(key, delta) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem('drape_cart', JSON.stringify(cart));
  updateBadges();
}

function getCartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function renderCart() {
  const container = document.getElementById('cart-items');
  document.getElementById('cart-count').textContent = `(${cart.length})`;
  if (!cart.length) {
    container.innerHTML = `<div class="empty-cart"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><p>Your cart is empty</p></div>`;
    document.getElementById('cart-total').textContent = '₹0';
    return;
  }
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
  <img class="cart-item-img" src="${item.image || getPlaceholderSrc(120,160,'DRAPE')}" alt="${item.name}" data-images='${JSON.stringify(item.image ? [item.image] : [])}' data-img-idx="0" onerror="handleImageError(this)" />
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>${item.size ? 'Size: ' + item.size : ''}${item.color ? ' · ' + item.color : ''}</p>
        <div class="cart-item-price">${APP_CONFIG.currencySymbol}${(item.price * item.qty).toLocaleString('en-IN')}</div>
        <div class="cart-item-actions">
          <button class="qty-btn" onclick="updateCartQty('${item.key}', -1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="updateCartQty('${item.key}', 1)">+</button>
          <button class="remove-item" onclick="removeFromCart('${item.key}')">×</button>
        </div>
      </div>
    </div>
  `).join('');
  document.getElementById('cart-total').textContent = `${APP_CONFIG.currencySymbol}${getCartTotal().toLocaleString('en-IN')}`;
}

function openCart() { renderCart(); document.getElementById('cart-sidebar').classList.add('open'); document.getElementById('cart-overlay').classList.add('open'); }
function closeCart() { document.getElementById('cart-sidebar').classList.remove('open'); document.getElementById('cart-overlay').classList.remove('open'); }

function proceedToCheckout() {
  if (!cart.length) { showToast('Your cart is empty.', 'error'); return; }
  closeCart();
  renderCheckoutSummary();
  showPage('checkout');
}

// ============================================================
//  WISHLIST
// ============================================================
async function toggleWishlist(id) {
  const idx = wishlist.indexOf(id);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    showToast('Removed from wishlist.');
    try { await Wishlist.remove(id); } catch (e) {}
  } else {
    wishlist.push(id);
    showToast('Added to wishlist! ♥', 'success');
    try { await Wishlist.add(id); } catch (e) {}
  }
  localStorage.setItem('drape_wishlist_ids', JSON.stringify(wishlist));
  updateBadges();
  renderFeaturedProducts();
  renderShopProducts();
  renderWishlistPage();
  const detailWishBtn = document.getElementById('detail-wish-btn');
  if (detailWishBtn) {
    detailWishBtn.textContent = wishlist.includes(id) ? '♥ Saved' : '♡ Wishlist';
  }
}

function renderWishlistPage() {
  const container = document.getElementById('wishlist-products');
  const items = allProducts.filter(p => wishlist.includes(p.id));
  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><p>Your wishlist is empty. Start adding items!</p><button class="btn-primary" onclick="showPage('shop')">Shop Now</button></div>`;
    return;
  }
  container.innerHTML = items.map(createProductCard).join('');
}

// ============================================================
//  CHECKOUT
// ============================================================
function renderCheckoutSummary() {
  const container = document.getElementById('checkout-items');
  if (!container) return;
  const total = getCartTotal();
  const shipping = total >= APP_CONFIG.freeShippingThreshold ? 0 : APP_CONFIG.shippingCharge;
  const discount = activePromoDiscount || 0;
  const grandTotal = total + shipping - discount;
  container.innerHTML = cart.map(item => `
    <div class="checkout-item">
  <img src="${item.image || getPlaceholderSrc(120,160,'DRAPE')}" alt="${item.name}" data-images='${JSON.stringify(item.image ? [item.image] : [])}' data-img-idx="0" onerror="handleImageError(this)" />
      <div class="checkout-item-info">
        <h4>${item.name}</h4>
        <p>${item.size || ''}${item.color ? ' · ' + item.color : ''} · Qty: ${item.qty}</p>
        <p style="font-weight:600;color:var(--accent)">${APP_CONFIG.currencySymbol}${(item.price * item.qty).toLocaleString('en-IN')}</p>
      </div>
    </div>
  `).join('');
  document.getElementById('summary-subtotal').textContent = `${APP_CONFIG.currencySymbol}${total.toLocaleString('en-IN')}`;
  document.getElementById('summary-shipping').textContent = shipping === 0 ? 'FREE' : `${APP_CONFIG.currencySymbol}${shipping}`;
  // Discount row
  const discEl = document.getElementById('summary-discount-row');
  if (discEl) discEl.style.display = discount ? 'flex' : 'none';
  const discAmt = document.getElementById('summary-discount');
  if (discAmt) discAmt.textContent = `-${APP_CONFIG.currencySymbol}${discount.toLocaleString('en-IN')}`;
  const promoLbl = document.getElementById('summary-promo-label');
  if (promoLbl) promoLbl.textContent = activePromoCode ? `Discount (${activePromoCode})` : 'Discount';
  document.getElementById('summary-total').textContent = `${APP_CONFIG.currencySymbol}${Math.max(0, grandTotal).toLocaleString('en-IN')}`;
}

function getCheckoutPricing() {
  const subtotal = getCartTotal();
  const shipping = subtotal >= APP_CONFIG.freeShippingThreshold ? 0 : APP_CONFIG.shippingCharge;
  const discount = activePromoDiscount || 0;
  const grandTotal = Math.max(0, subtotal + shipping - discount);
  return { subtotal, shipping, discount, grandTotal };
}

function buildOrderItemsSnapshot(items) {
  return (items || []).map(item => ({
    key: item.key || null,
    product_id: item.id || null,
    name: item.name || 'Product',
    price: Number(item.price || 0),
    qty: Number(item.qty || 1),
    size: item.size || null,
    color: item.color || null,
    image: item.image || null,
    category: item.category || null
  }));
}

function normalizeOrderRecord(order) {
  return {
    ...order,
    items: Array.isArray(order?.items) ? order.items : [],
    shipping_details: order?.shipping_details && typeof order.shipping_details === 'object' ? order.shipping_details : {},
    customer_details: order?.customer_details && typeof order.customer_details === 'object' ? order.customer_details : {},
    pricing_details: order?.pricing_details && typeof order.pricing_details === 'object' ? order.pricing_details : {}
  };
}

function mergeOrders(remoteOrders, localOrders) {
  const merged = new Map();
  [...(remoteOrders || []), ...(localOrders || [])].forEach(order => {
    const normalized = normalizeOrderRecord(order);
    if (!normalized.id) return;
    if (!merged.has(normalized.id)) merged.set(normalized.id, normalized);
  });
  return Array.from(merged.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

async function getOrderHistory() {
  const localOrders = (JSON.parse(localStorage.getItem('drape_orders') || '[]') || []).map(normalizeOrderRecord);
  if (!currentUser) return localOrders;

  try {
    const remoteOrders = (await Orders.getByUser()).map(normalizeOrderRecord);
    const mergedOrders = mergeOrders(remoteOrders, localOrders);
    localStorage.setItem('drape_orders', JSON.stringify(mergedOrders));
    return mergedOrders;
  } catch (e) {
    console.warn('Falling back to local orders:', e.message);
    return localOrders;
  }
}

document.querySelectorAll('.payment-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.payment-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
  });
});

async function placeOrder() {
  const fname = document.getElementById('ship-fname').value.trim();
  const lname = document.getElementById('ship-lname').value.trim();
  const email = document.getElementById('ship-email').value.trim();
  const phone = document.getElementById('ship-phone').value.trim();
  const addr = document.getElementById('ship-addr').value.trim();
  const city = document.getElementById('ship-city').value.trim();
  const pin = document.getElementById('ship-pin').value.trim();
  const state = document.getElementById('ship-state').value.trim();

  if (!fname || !email || !phone || !addr || !city || !pin || !state) {
    showToast('Please fill all shipping details.', 'error'); return;
  }

  const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'razorpay';
  const pricing = getCheckoutPricing();
  const customerDetails = {
    first_name: fname,
    last_name: lname,
    full_name: `${fname} ${lname}`.trim(),
    email,
    phone
  };
  const shippingDetails = {
    ...customerDetails,
    address: addr,
    city,
    pincode: pin,
    state
  };
  const orderItems = buildOrderItemsSnapshot(cart);
  const baseOrderData = {
    items: orderItems,
    total: pricing.grandTotal,
    shipping_details: shippingDetails,
    customer_details: customerDetails,
    pricing_details: {
      subtotal: pricing.subtotal,
      shipping_charge: pricing.shipping,
      discount: pricing.discount,
      grand_total: pricing.grandTotal,
      promo_code: activePromoCode || null,
      currency: APP_CONFIG.currency
    },
    order_source: 'web_checkout'
  };

  if (paymentMethod === 'cod') {
    await createOrderRecord({
      ...baseOrderData,
      payment_method: 'cod',
      status: 'confirmed'
    });
    return;
  }

  // Razorpay
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: pricing.grandTotal * 100, // paise
    currency: 'INR',
    name: APP_CONFIG.appName,
    description: `Order for ${orderItems.length} item(s)`,
    image: 'https://i.imgur.com/3g7nmJC.png',
    prefill: { name: `${fname} ${lname}`, email, contact: phone },
    theme: { color: '#C8956C' },
    handler: async function(response) {
      await createOrderRecord({
        ...baseOrderData,
        payment_method: 'razorpay',
        payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id || null,
        status: 'confirmed'
      });
    },
    modal: {
      ondismiss: function() { showToast('Payment cancelled.', 'error'); }
    }
  };
  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function(response) {
    showToast('Payment failed: ' + response.error.description, 'error');
  });
  rzp.open();
}

async function createOrderRecord(orderData) {
  let orderId = 'ORD-' + Date.now();
  const normalizedOrder = normalizeOrderRecord({
    ...orderData,
    created_at: new Date().toISOString()
  });

  try {
    const created = await Orders.create(orderData);
    orderId = created.id || orderId;
    Object.assign(normalizedOrder, normalizeOrderRecord(created));
  } catch (e) {
    console.warn('Order save error (may be Supabase not configured):', e.message);
  }

  // Save order to localStorage for local order history
  const savedOrder = {
    ...normalizedOrder,
    id: orderId
  };
  const existingOrders = JSON.parse(localStorage.getItem('drape_orders') || '[]');
  const mergedOrders = mergeOrders([savedOrder], existingOrders);
  localStorage.setItem('drape_orders', JSON.stringify(mergedOrders));

  // Award loyalty points
  const ptsEarned = addLoyaltyPoints(orderData.total || 0);

  cart = [];
  activePromoDiscount = 0;
  activePromoCode = '';
  saveCart();
  renderCart();
  document.getElementById('order-id-display').textContent = `Order ID: ${orderId}`;
  showPage('order-success');
  showToast(`Order confirmed! 🎉 You earned ${ptsEarned} loyalty points!`, 'success');
}

// ============================================================
//  PROFILE PAGE
// ============================================================
async function renderProfilePage() {
  if (!currentUser) { showPage('home'); openAuthModal('login'); return; }

  const meta = currentUser.user_metadata || {};
  const saved = JSON.parse(localStorage.getItem('drape_profile_' + currentUser.id) || '{}');

  // Header
  const name = meta.full_name || saved.fullName || currentUser.email?.split('@')[0] || 'User';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const bigAvatar = document.getElementById('profile-big-avatar');
  const pageName = document.getElementById('profile-page-name');
  const pageEmail = document.getElementById('profile-page-email');
  if (bigAvatar) bigAvatar.textContent = initials;
  if (pageName) pageName.textContent = name;
  if (pageEmail) pageEmail.textContent = currentUser.email || '';

  // Fill form fields
  const fn = document.getElementById('profile-fullname');
  const pe = document.getElementById('profile-email-display');
  const ph = document.getElementById('profile-phone');
  const a1 = document.getElementById('profile-addr1');
  const ac = document.getElementById('profile-city');
  const as = document.getElementById('profile-state');
  const ap = document.getElementById('profile-pin');
  if (fn) fn.value = saved.fullName || meta.full_name || '';
  if (pe) pe.value = currentUser.email || '';
  if (ph) ph.value = saved.phone || '';
  if (a1) a1.value = saved.addr1 || '';
  if (ac) ac.value = saved.city || '';
  if (as) as.value = saved.state || '';
  if (ap) ap.value = saved.pin || '';

  // Stats
  const orders = await getOrderHistory();
  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);
  const statO = document.getElementById('stat-orders');
  const statW = document.getElementById('stat-wishlist');
  const statS = document.getElementById('stat-spent');
  if (statO) statO.textContent = orders.length;
  if (statW) statW.textContent = wishlist.length;
  if (statS) statS.textContent = '₹' + totalSpent.toLocaleString('en-IN');

  // Loyalty
  if (typeof renderLoyaltyWidget === 'function') renderLoyaltyWidget();
}

function saveProfile() {
  if (!currentUser) return;
  const name = document.getElementById('profile-fullname').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const msg = document.getElementById('profile-save-msg');
  if (!name) { showMsg(msg, 'Name cannot be empty.', 'error'); return; }
  const saved = JSON.parse(localStorage.getItem('drape_profile_' + currentUser.id) || '{}');
  saved.fullName = name;
  saved.phone = phone;
  localStorage.setItem('drape_profile_' + currentUser.id, JSON.stringify(saved));
  // Update display
  const pageName = document.getElementById('profile-page-name');
  const pdName = document.getElementById('pd-user-name');
  const bigAvatar = document.getElementById('profile-big-avatar');
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  if (pageName) pageName.textContent = name;
  if (pdName) pdName.textContent = name;
  if (bigAvatar) bigAvatar.textContent = initials;
  const pdAvatar = document.getElementById('pd-avatar-initials');
  if (pdAvatar) pdAvatar.textContent = initials;
  showMsg(msg, 'Profile saved! ✓', 'success');
  showToast('Profile updated!', 'success');
  setTimeout(() => { msg.textContent = ''; }, 2000);
}

async function changePassword() {
  const np = document.getElementById('profile-new-pass').value;
  const cp = document.getElementById('profile-confirm-pass').value;
  const msg = document.getElementById('profile-pass-msg');
  if (!np || !cp) { showMsg(msg, 'Please fill both fields.', 'error'); return; }
  if (np.length < 6) { showMsg(msg, 'Password must be at least 6 characters.', 'error'); return; }
  if (np !== cp) { showMsg(msg, 'Passwords do not match.', 'error'); return; }
  try {
    const { error } = await Auth.updatePassword(np);
    if (error) throw error;
    showMsg(msg, 'Password updated! ✓', 'success');
    document.getElementById('profile-new-pass').value = '';
    document.getElementById('profile-confirm-pass').value = '';
    showToast('Password changed successfully!', 'success');
    setTimeout(() => { msg.textContent = ''; }, 2000);
  } catch (e) {
    showMsg(msg, e.message || 'Failed to update password.', 'error');
  }
}

function saveAddress() {
  if (!currentUser) return;
  const addr1 = document.getElementById('profile-addr1').value.trim();
  const city = document.getElementById('profile-city').value.trim();
  const state = document.getElementById('profile-state').value.trim();
  const pin = document.getElementById('profile-pin').value.trim();
  const msg = document.getElementById('profile-addr-msg');
  const saved = JSON.parse(localStorage.getItem('drape_profile_' + currentUser.id) || '{}');
  saved.addr1 = addr1; saved.city = city; saved.state = state; saved.pin = pin;
  localStorage.setItem('drape_profile_' + currentUser.id, JSON.stringify(saved));
  showMsg(msg, 'Address saved! ✓', 'success');
  showToast('Address saved!', 'success');
  setTimeout(() => { msg.textContent = ''; }, 2000);
}

// ============================================================
//  ORDERS PAGE
// ============================================================
async function renderOrdersPage() {
  const container = document.getElementById('orders-list');
  if (!container) return;
  container.innerHTML = `<div class="empty-state"><p>Loading your orders...</p></div>`;
  const orders = await getOrderHistory();

  if (!orders.length) {
    container.innerHTML = `
      <div class="orders-empty">
        <div class="orders-empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
        </div>
        <h3>No orders yet</h3>
        <p>Looks like you haven't placed any orders. Start shopping!</p>
        <button class="btn-primary" onclick="showPage('shop')">Browse Products</button>
      </div>`;
    return;
  }

  const statusColors = {
    pending:   { bg: '#FFF3CD', color: '#856404' },
    confirmed: { bg: '#D1ECF1', color: '#0C5460' },
    shipped:   { bg: '#D4EDDA', color: '#155724' },
    delivered: { bg: '#D4EDDA', color: '#155724' },
    cancelled: { bg: '#F8D7DA', color: '#721C24' }
  };

  container.innerHTML = orders.map(order => {
    const date = new Date(order.created_at);
    const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const status = order.status || 'confirmed';
    const sc = statusColors[status] || statusColors.confirmed;
    const payLabel = order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment';

    const itemsHTML = (order.items || []).map(item => `
      <div class="order-item-row">
        <div class="order-item-img">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" data-images='${JSON.stringify([item.image])}' data-img-idx="0" onerror="handleImageError(this)">` : `<img src="${getPlaceholderSrc(80,100,'DRAPE')}" alt="${item.name}" onerror="handleImageError(this)" />`}
        </div>
        <div class="order-item-info">
          <span class="order-item-name">${item.name || 'Product'}</span>
          <span class="order-item-meta">
            ${item.size ? `Size: ${item.size}` : ''}
            ${item.size && item.color ? ' · ' : ''}
            ${item.color ? `Color: ${item.color}` : ''}
            ${(item.size || item.color) ? ' · ' : ''}
            Qty: ${item.qty || 1}
          </span>
        </div>
        <div class="order-item-price">${APP_CONFIG.currencySymbol}${((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}</div>
      </div>`).join('');

    const shipping = order.shipping_details || {};
    const pricing = order.pricing_details || {};
    const displayTotal = pricing.grand_total || order.total || 0;
    const paymentReference = order.payment_id || order.razorpay_order_id || '';

    return `
      <div class="order-card">
        <div class="order-card-head">
          <div class="order-card-head-left">
            <span class="order-id-label">ORDER</span>
            <span class="order-id-val">${order.id}</span>
            <span class="order-date">${dateStr} at ${timeStr}</span>
          </div>
          <span class="order-status-badge" style="background:${sc.bg};color:${sc.color};">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div class="order-card-body">
          <div class="order-items-list">${itemsHTML}</div>
          <div class="order-card-footer">
            <div class="order-card-meta">
              ${shipping.full_name || shipping.name ? `<span><strong>Ship to:</strong> ${shipping.full_name || shipping.name}, ${shipping.city || ''}</span>` : ''}
              <span><strong>Payment:</strong> ${payLabel}</span>
              ${paymentReference ? `<span><strong>Ref:</strong> ${paymentReference}</span>` : ''}
            </div>
            <div class="order-total-row">
              <span>Order Total</span>
              <span class="order-total-val">${APP_CONFIG.currencySymbol}${displayTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div class="order-actions">
            <button class="btn-outline small" onclick="openTrackingModal('${order.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Track Order
            </button>
            <button class="btn-outline small" onclick="reorder('${order.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.68"/></svg>
              Reorder
            </button>
            <button class="btn-outline small" onclick="openReturnModal('${order.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-3.68"/></svg>
              Return / Exchange
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ============================================================
//  NEWSLETTER
// ============================================================
async function subscribeNewsletter() {
  const email = document.getElementById('newsletter-email').value.trim();
  if (!email) return;
  try {
    await Newsletter.subscribe(email);
    document.getElementById('newsletter-email').value = '';
    showToast('Subscribed successfully! 🎉', 'success');
  } catch (e) {
    showToast(e.message || 'Could not subscribe.', 'error');
  }
}

// ============================================================
//  UTILITIES
// ============================================================
function updateBadges() {
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cart-badge').textContent = cartCount;
  document.getElementById('cart-badge').style.display = cartCount ? 'flex' : 'none';
  document.getElementById('wishlist-badge').textContent = wishlist.length;
  document.getElementById('wishlist-badge').style.display = wishlist.length ? 'flex' : 'none';
}

let toastTimeout;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toast.className = 'toast'; }, 3000);
}
