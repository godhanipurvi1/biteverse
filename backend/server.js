const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

const JWT_SECRET = 'your-secret-key-change-in-production';
const DB_PATH = path.join(__dirname, 'database.json');

// Initialize database
const initializeDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    const initialDB = {
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'user@example.com',
          password: bcrypt.hashSync('password123', 10),
          phone: '9876543210',
          address: '123 Main St, City'
        }
      ],
      restaurants: [
        {
          id: '1',
          name: 'Pizza Palace',
          image: 'https://images.unsplash.com/photo-1564936281288-7271eba65f84?w=400',
          rating: 4.5,
          deliveryTime: '30-45 min',
          deliveryFee: 2,
          description: 'Best pizza in town',
          cuisine: 'Italian'
        },
        {
          id: '2',
          name: 'Burger Bash',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
          rating: 4.3,
          deliveryTime: '25-35 min',
          deliveryFee: 2,
          description: 'Juicy burgers and fries',
          cuisine: 'American'
        },
        {
          id: '3',
          name: 'Sushi Supreme',
          image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
          rating: 4.8,
          deliveryTime: '40-50 min',
          deliveryFee: 3,
          description: 'Fresh sushi daily',
          cuisine: 'Japanese'
        },
        {
          id: '4',
          name: 'Spice Route',
          image: 'https://images.unsplash.com/photo-1585937421612-70a19fb6930b?w=400',
          rating: 4.6,
          deliveryTime: '35-45 min',
          deliveryFee: 2,
          description: 'Authentic Indian cuisine',
          cuisine: 'Indian'
        }
      ],
      menuItems: [
        // Pizza Palace menu
        { id: '1', restaurantId: '1', name: 'Margherita Pizza', price: 12.99, description: 'Classic cheese pizza', image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=300', category: 'Pizza' },
        { id: '2', restaurantId: '1', name: 'Pepperoni Pizza', price: 14.99, description: 'Loaded with pepperoni', image: 'https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=300', category: 'Pizza' },
        { id: '3', restaurantId: '1', name: 'Garlic Bread', price: 5.99, description: 'Crispy garlic bread', image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64359?w=300', category: 'Appetizers' },
        // Burger Bash menu
        { id: '4', restaurantId: '2', name: 'Classic Burger', price: 9.99, description: 'Juicy beef patty', image: 'https://images.unsplash.com/photo-1550547990-294e817617e6?w=300', category: 'Burgers' },
        { id: '5', restaurantId: '2', name: 'Double Cheese Burger', price: 11.99, description: 'Double patty with cheese', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300', category: 'Burgers' },
        { id: '6', restaurantId: '2', name: 'French Fries', price: 3.99, description: 'Crispy golden fries', image: 'https://images.unsplash.com/photo-1576107232684-871b8e859400?w=300', category: 'Sides' },
        // Sushi Supreme menu
        { id: '7', restaurantId: '3', name: 'California Roll', price: 8.99, description: 'Crab, avocado, cucumber', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300', category: 'Sushi' },
        { id: '8', restaurantId: '3', name: 'Spicy Tuna Roll', price: 9.99, description: 'Spicy tuna and rice', image: 'https://images.unsplash.com/photo-1553621042-f6b4b1c905cb?w=300', category: 'Sushi' },
        { id: '9', restaurantId: '3', name: 'Miso Soup', price: 4.99, description: 'Traditional miso soup', image: 'https://images.unsplash.com/photo-1551632440-5bcb9b19ac4c?w=300', category: 'Soup' },
        // Spice Route menu
        { id: '10', restaurantId: '4', name: 'Butter Chicken', price: 13.99, description: 'Creamy tomato sauce', image: 'https://images.unsplash.com/photo-1565557623814-dea6bde51a62?w=300', category: 'Curry' },
        { id: '11', restaurantId: '4', name: 'Tandoori Chicken', price: 12.99, description: 'Spiced grilled chicken', image: 'https://images.unsplash.com/photo-1585937421612-70a19fb6930b?w=300', category: 'Curry' },
        { id: '12', restaurantId: '4', name: 'Naan Bread', price: 3.99, description: 'Freshly baked naan', image: 'https://images.unsplash.com/photo-1543353521-104e5d5ea118?w=300', category: 'Bread' }
      ],
      orders: [],
      cart: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
  }
};

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// AUTH ROUTES
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  const db = readDB();
  
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    phone,
    address: ''
  };
  
  db.users.push(newUser);
  writeDB(db);
  
  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET);
  res.json({ token, user: { id: newUser.id, name, email, phone } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address });
});

// RESTAURANTS
app.get('/api/restaurants', (req, res) => {
  const db = readDB();
  res.json(db.restaurants);
});

app.get('/api/restaurants/:id', (req, res) => {
  const db = readDB();
  const restaurant = db.restaurants.find(r => r.id === req.params.id);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
  res.json(restaurant);
});

// MENU ITEMS
app.get('/api/menu/:restaurantId', (req, res) => {
  const db = readDB();
  const items = db.menuItems.filter(m => m.restaurantId === req.params.restaurantId);
  res.json(items);
});

app.get('/api/menu-item/:id', (req, res) => {
  const db = readDB();
  const item = db.menuItems.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

// CART
app.get('/api/cart', authenticateToken, (req, res) => {
  const db = readDB();
  const userCart = db.cart.filter(c => c.userId === req.user.id);
  const cartWithDetails = userCart.map(item => {
    const menuItem = db.menuItems.find(m => m.id === item.itemId);
    return { ...item, details: menuItem };
  });
  res.json(cartWithDetails);
});

app.post('/api/cart', authenticateToken, (req, res) => {
  const { itemId, quantity, restaurantId } = req.body;
  const db = readDB();
  
  const existingItem = db.cart.find(c => c.userId === req.user.id && c.itemId === itemId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    db.cart.push({
      id: Date.now().toString(),
      userId: req.user.id,
      itemId,
      restaurantId,
      quantity,
      addedAt: new Date()
    });
  }
  
  writeDB(db);
  res.json({ success: true });
});

app.put('/api/cart/:id', authenticateToken, (req, res) => {
  const { quantity } = req.body;
  const db = readDB();
  const cartItem = db.cart.find(c => c.id === req.params.id && c.userId === req.user.id);
  
  if (!cartItem) return res.status(404).json({ error: 'Item not found' });
  
  cartItem.quantity = quantity;
  writeDB(db);
  res.json({ success: true });
});

app.delete('/api/cart/:id', authenticateToken, (req, res) => {
  const db = readDB();
  db.cart = db.cart.filter(c => !(c.id === req.params.id && c.userId === req.user.id));
  writeDB(db);
  res.json({ success: true });
});

app.delete('/api/cart-all', authenticateToken, (req, res) => {
  const db = readDB();
  db.cart = db.cart.filter(c => c.userId !== req.user.id);
  writeDB(db);
  res.json({ success: true });
});

// ORDERS
app.post('/api/orders', authenticateToken, (req, res) => {
  const { restaurantId, items, deliveryAddress, total } = req.body;
  const db = readDB();
  
  const newOrder = {
    id: Date.now().toString(),
    userId: req.user.id,
    restaurantId,
    items,
    deliveryAddress,
    total,
    status: 'confirmed',
    createdAt: new Date(),
    estimatedDelivery: new Date(Date.now() + 45 * 60000)
  };
  
  db.orders.push(newOrder);
  db.cart = db.cart.filter(c => c.userId !== req.user.id);
  writeDB(db);
  
  res.json(newOrder);
});

app.get('/api/orders', authenticateToken, (req, res) => {
  const db = readDB();
  const userOrders = db.orders.filter(o => o.userId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(userOrders);
});

app.get('/api/orders/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// USER PROFILE
app.put('/api/users/profile', authenticateToken, (req, res) => {
  const { name, phone, address } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  user.name = name || user.name;
  user.phone = phone || user.phone;
  user.address = address || user.address;
  
  writeDB(db);
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address });
});

// SEARCH
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  const db = readDB();
  
  const restaurants = db.restaurants.filter(r => 
    r.name.toLowerCase().includes(q.toLowerCase()) || 
    r.cuisine.toLowerCase().includes(q.toLowerCase())
  );
  
  const items = db.menuItems.filter(m => 
    m.name.toLowerCase().includes(q.toLowerCase()) || 
    m.description.toLowerCase().includes(q.toLowerCase())
  );
  
  res.json({ restaurants, items });
});

initializeDB();

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});