# Bauprojekte & Order Notes - Implementation Guide

## Features Added

### 1. Bauprojekte (Construction Projects) Management
Admin can create, edit, and delete construction projects that users can select when placing orders.

### 2. Project Selection in Orders
Users must select a Bauprojekt when submitting an order from the cart.

### 3. Order Notes
Users can add optional notes/comments to their orders.

## Database Schema

### New Tables

#### `bauprojekte` Table
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(255) NOT NULL
- description: TEXT
- location: VARCHAR(255)
- start_date: DATE
- end_date: DATE
- status: VARCHAR(50) ['active', 'completed', 'on_hold']
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `bestellungen` Table (Updated)
```sql
- id: SERIAL PRIMARY KEY
- projekt_id: INTEGER (FK to bauprojekte)
- items: JSONB (array of order items)
- notes: TEXT
- total_items: INTEGER
- status: VARCHAR(50) ['pending', 'approved', 'completed', 'cancelled']
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Backend API Endpoints

### Bauprojekte Routes (`/api/v1/bauprojekte`)

#### GET `/` - Get all projects
Query Parameters:
- `status` (optional): Filter by status ('active', 'completed', 'on_hold')

Response:
```json
{
  "projects": [
    {
      "id": 1,
      "name": "Neubau Bürogebäude",
      "description": "Modernes Bürogebäude mit 5 Etagen",
      "location": "München Hauptstraße 123",
      "start_date": "2024-01-15",
      "status": "active",
      "created_at": "2024-01-01T10:00:00",
      "updated_at": "2024-01-01T10:00:00"
    }
  ]
}
```

#### GET `/{projekt_id}` - Get specific project

#### POST `/` - Create new project (Admin)
Request Body:
```json
{
  "name": "Neubau Bürogebäude",
  "description": "Modern office building",
  "location": "München",
  "start_date": "2024-01-15",
  "status": "active"
}
```

#### PUT `/{projekt_id}` - Update project (Admin)

#### DELETE `/{projekt_id}` - Delete project (Admin)

### Bestellungen Routes (`/api/v1/bestellungen`)

#### GET `/` - Get all orders
Returns orders with project information

#### GET `/{order_id}` - Get specific order

#### POST `/` - Create new order
Request Body:
```json
{
  "projekt_id": 1,
  "items": [
    {
      "productId": "C001",
      "name": "Schraube TX20",
      "quantity": 100,
      "unit": "Stk"
    }
  ],
  "notes": "Lieferung bis Freitag erforderlich"
}
```

#### PUT `/{order_id}/status` - Update order status (Admin)

## Frontend Components

### 1. Cart Page (`Cart.tsx`)
Updated with:
- **Project Selection Dropdown**: Required field showing all active projects
- **Notes Textarea**: Optional field for order comments
- **Improved Validation**: Ensures project is selected before submission

### 2. Bauprojekte Management Page (`BauprojekteManagement.tsx`)
Admin interface for:
- Viewing all projects in a grid layout
- Creating new projects with a modal dialog
- Editing existing projects
- Deleting projects (with confirmation)
- Visual status indicators (active/completed/on_hold)

## Setup Instructions

### 1. Initialize Database

Run the SQL initialization script:
```bash
psql -U your_user -d your_database -f server/init_db.sql
```

Or manually execute the SQL:
```sql
-- See init_db.sql for complete schema
```

### 2. Restart Backend

The routes are automatically registered. Just restart:
```bash
cd server
python main.py
```

### 3. Access New Features

#### For Users (Cart/Checkout):
1. Add items to cart
2. Navigate to `/cart`
3. Select a Bauprojekt from dropdown
4. Optionally add notes
5. Submit order

#### For Admins (Project Management):
1. Navigate to `/bauprojekte-management`
2. Create new projects with the "+ Neues Projekt" button
3. Edit projects by clicking "Bearbeiten"
4. Delete projects with trash icon

## API Usage Examples

### Fetch Active Projects
```typescript
const response = await fetch(apiUrl("/api/v1/bauprojekte/?status=active"));
const data = await response.json();
console.log(data.projects);
```

### Create Order with Project and Notes
```typescript
const orderData = {
  projekt_id: 1,
  items: [
    { productId: "C001", name: "Schraube", quantity: 100, unit: "Stk" }
  ],
  notes: "Urgent delivery needed"
};

const response = await fetch(apiUrl("/api/v1/bestellungen/"), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(orderData)
});
```

### Create New Project (Admin)
```typescript
const projectData = {
  name: "Neubau Bürogebäude",
  description: "Modern office building with 5 floors",
  location: "München Hauptstraße 123",
  start_date: "2024-01-15",
  status: "active"
};

const response = await fetch(apiUrl("/api/v1/bauprojekte/"), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(projectData)
});
```

## Component Integration

### Add Route to Router
```typescript
import BauprojekteManagement from "@/pages/BauprojekteManagement";

// In your router configuration:
{
  path: "/bauprojekte-management",
  element: <BauprojekteManagement />
}
```

### Navigation
Add to your admin menu:
```tsx
<Link to="/bauprojekte-management">
  <Building2 className="h-4 w-4" />
  Bauprojekte verwalten
</Link>
```

## Validation Rules

### Orders:
- `projekt_id` is **required**
- `items` array must not be empty
- `notes` is optional (max recommended: 1000 characters)

### Projects:
- `name` is **required**
- `status` must be one of: 'active', 'completed', 'on_hold'
- Other fields are optional

## Status Indicators

### Project Status Colors:
- **Active** (green): Project is ongoing
- **Completed** (blue): Project finished
- **On Hold** (yellow): Project temporarily paused

### Order Status:
- **Pending** (yellow): Awaiting approval
- **Approved** (blue): Order approved
- **Completed** (green): Order fulfilled
- **Cancelled** (red): Order cancelled

## Security Considerations

### TODO for Production:
1. **Add Authentication**: Protect admin routes (create/edit/delete projects)
2. **Add Authorization**: Ensure only admins can manage projects
3. **Validate Input**: Add server-side validation for all inputs
4. **Sanitize Notes**: Prevent XSS attacks in order notes
5. **Rate Limiting**: Protect API endpoints from abuse

## Testing

### Test Project Creation:
```bash
curl -X POST http://localhost:8001/api/v1/bauprojekte/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "location": "Test Location",
    "status": "active"
  }'
```

### Test Order Creation:
```bash
curl -X POST http://localhost:8001/api/v1/bestellungen/ \
  -H "Content-Type: application/json" \
  -d '{
    "projekt_id": 1,
    "items": [{"productId": "C001", "name": "Test", "quantity": 10, "unit": "Stk"}],
    "notes": "Test order"
  }'
```

## Troubleshooting

### "Projekt erforderlich" Error
- Make sure at least one active project exists in the database
- Check that the projects are loading in the dropdown

### Projects Not Loading
- Verify backend is running on port 8001
- Check CORS settings in `main.py`
- Inspect browser console for fetch errors

### Database Connection Error
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env` file
- Run `init_db.sql` to create tables

## Future Enhancements

1. **Project Budgets**: Add budget tracking per project
2. **Project Team**: Assign users to specific projects
3. **Order History**: View all orders per project
4. **Analytics**: Track costs and materials per project
5. **File Attachments**: Allow uploading project documents
6. **Notifications**: Email/SMS when order status changes

---

**All features are now ready to use!**
