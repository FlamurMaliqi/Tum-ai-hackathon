# Automatic Order Approval System

## Overview

The order approval system automatically approves orders under 100€ while requiring manual approval for orders 100€ and above.

## How It Works

### Automatic Approval Logic

```
Order Total Price < 100€  → Status: 'approved' (Auto-approved)
Order Total Price ≥ 100€  → Status: 'pending'  (Requires approval)
```

### Order Status Flow

```
┌─────────────┐
│ Order Created│
└──────┬──────┘
       │
       ├─────── Price < 100€ ──→ Status: 'approved' (Auto)
       │
       └─────── Price ≥ 100€ ──→ Status: 'pending'
                                       │
                                       ├──→ Admin Approves ──→ Status: 'approved'
                                       │
                                       └──→ Admin Rejects ───→ Status: 'cancelled'
```

## Database Schema Changes

### New Column: `total_price`

```sql
ALTER TABLE bestellungen 
ADD COLUMN total_price DECIMAL(10, 2) DEFAULT 0.00;
```

The `bestellungen` table now stores:
- `total_price`: Total order amount in euros
- `status`: Order status ('pending', 'approved', 'completed', 'cancelled')

## API Changes

### POST `/api/v1/bestellungen/` - Create Order

**Request Body:**
```json
{
  "projekt_id": 1,
  "items": [
    {
      "productId": "C001",
      "name": "Schraube TX20",
      "quantity": 100,
      "unit": "Stk",
      "price": 0.50
    }
  ],
  "notes": "Urgent delivery"
}
```

**Response (Auto-Approved):**
```json
{
  "id": 123,
  "projekt_id": 1,
  "items": [...],
  "notes": "Urgent delivery",
  "total_items": 100,
  "total_price": 50.00,
  "status": "approved",
  "approval_message": "Auto-approved (under 100€)",
  "requires_approval": false,
  "created_at": "2024-01-15T10:00:00"
}
```

**Response (Requires Approval):**
```json
{
  "id": 124,
  "projekt_id": 1,
  "items": [...],
  "total_price": 250.00,
  "status": "pending",
  "approval_message": "Requires approval (100€ or more)",
  "requires_approval": true,
  "created_at": "2024-01-15T10:05:00"
}
```

### GET `/api/v1/bestellungen/pending` - Get Pending Orders

Returns all orders that require approval.

**Response:**
```json
{
  "orders": [
    {
      "id": 124,
      "projekt_id": 1,
      "projekt_name": "Neubau Bürogebäude",
      "total_price": 250.00,
      "status": "pending",
      "created_at": "2024-01-15T10:05:00"
    }
  ],
  "count": 1
}
```

### PUT `/api/v1/bestellungen/{order_id}/approve` - Approve Order (Admin)

Quick action to approve a pending order.

**Response:**
```json
{
  "id": 124,
  "status": "approved",
  "message": "Order status updated successfully"
}
```

### PUT `/api/v1/bestellungen/{order_id}/reject` - Reject Order (Admin)

Quick action to cancel/reject a pending order.

**Response:**
```json
{
  "id": 124,
  "status": "cancelled",
  "message": "Order status updated successfully"
}
```

## Frontend Changes

### Cart Component

The cart now:
1. **Calculates total price** from all items
2. **Sends price with each item** in the order
3. **Shows different notifications** based on approval status:
   - Under 100€: "Bestellung genehmigt" (green)
   - 100€ or more: "Bestellung eingereicht - wartet auf Genehmigung" (yellow)

**Example Toast Messages:**

```typescript
// Auto-approved (< 100€)
toast({
  title: "Bestellung genehmigt",
  description: "Bestellung #123 wurde automatisch genehmigt (unter 100€)."
});

// Requires approval (≥ 100€)
toast({
  title: "Bestellung eingereicht",
  description: "Bestellung #124 wartet auf Genehmigung (100€ oder mehr)."
});
```

## Setup Instructions

### 1. Update Database Schema

**For New Installations:**
```bash
psql -U your_user -d your_database -f server/init_db.sql
```

**For Existing Installations:**
```bash
psql -U your_user -d your_database -f server/migration_add_total_price.sql
```

Or manually:
```sql
ALTER TABLE bestellungen 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2) DEFAULT 0.00;
```

### 2. Restart Backend

The routes are automatically updated. Just restart:
```bash
cd server
python main.py
```

### 3. Test the System

#### Test Auto-Approval (< 100€):
```bash
curl -X POST http://localhost:8001/api/v1/bestellungen/ \
  -H "Content-Type: application/json" \
  -d '{
    "projekt_id": 1,
    "items": [
      {
        "productId": "C001",
        "name": "Schraube",
        "quantity": 50,
        "unit": "Stk",
        "price": 1.50
      }
    ],
    "notes": "Test order"
  }'
```
Expected: `status: "approved"`, `total_price: 75.00`

#### Test Manual Approval Required (≥ 100€):
```bash
curl -X POST http://localhost:8001/api/v1/bestellungen/ \
  -H "Content-Type: application/json" \
  -d '{
    "projekt_id": 1,
    "items": [
      {
        "productId": "C001",
        "name": "Schraube",
        "quantity": 100,
        "unit": "Stk",
        "price": 2.00
      }
    ]
  }'
```
Expected: `status: "pending"`, `total_price: 200.00`, `requires_approval: true`

## Admin Approval Workflow

### View Pending Orders

```typescript
const response = await fetch(apiUrl("/api/v1/bestellungen/pending"));
const { orders, count } = await response.json();

console.log(`${count} orders require approval`);
```

### Approve an Order

```typescript
const orderId = 124;
const response = await fetch(
  apiUrl(`/api/v1/bestellungen/${orderId}/approve`),
  { method: "PUT" }
);

if (response.ok) {
  console.log("Order approved!");
}
```

### Reject an Order

```typescript
const orderId = 124;
const response = await fetch(
  apiUrl(`/api/v1/bestellungen/${orderId}/reject`),
  { method: "PUT" }
);

if (response.ok) {
  console.log("Order rejected!");
}
```

## Creating an Admin Approval UI

Here's a simple React component for managing pending orders:

```tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api";

export default function PendingOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    const response = await fetch(apiUrl("/api/v1/bestellungen/pending"));
    const data = await response.json();
    setOrders(data.orders);
  };

  const handleApprove = async (orderId) => {
    await fetch(apiUrl(`/api/v1/bestellungen/${orderId}/approve`), {
      method: "PUT",
    });
    fetchPendingOrders(); // Refresh list
  };

  const handleReject = async (orderId) => {
    await fetch(apiUrl(`/api/v1/bestellungen/${orderId}/reject`), {
      method: "PUT",
    });
    fetchPendingOrders(); // Refresh list
  };

  return (
    <div>
      <h1>Orders Requiring Approval ({orders.length})</h1>
      {orders.map((order) => (
        <div key={order.id} className="border p-4 mb-2">
          <p>Order #{order.id} - €{order.total_price}</p>
          <p>Project: {order.projekt_name}</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => handleApprove(order.id)}>
              Approve
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleReject(order.id)}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Status Badge Components

```tsx
const getStatusBadge = (status: string, totalPrice: number) => {
  switch (status) {
    case 'approved':
      return (
        <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded">
          {totalPrice < 100 ? 'Auto-Approved' : 'Approved'}
        </span>
      );
    case 'pending':
      return (
        <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
          Awaiting Approval (€{totalPrice})
        </span>
      );
    case 'cancelled':
      return (
        <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded">
          Rejected
        </span>
      );
    case 'completed':
      return (
        <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded">
          Completed
        </span>
      );
  }
};
```

## Configuration

To change the approval threshold, edit the value in `bestellungen.py`:

```python
# Current: 100€ threshold
if total_price < 100:
    order_status = 'approved'
else:
    order_status = 'pending'

# Change to 200€:
if total_price < 200:
    order_status = 'approved'
else:
    order_status = 'pending'
```

## Security Considerations

### Production Recommendations:

1. **Add Authentication**: Protect approval endpoints
2. **Add Authorization**: Only admins can approve/reject
3. **Audit Log**: Track who approved/rejected orders
4. **Notifications**: Email/SMS when order requires approval
5. **Approval Comments**: Allow admins to add rejection reasons

## Testing Scenarios

### Test Case 1: Order Under 100€
- **Input**: 50 items @ €1.50 each = €75
- **Expected**: Auto-approved
- **Status**: `approved`

### Test Case 2: Order Exactly 100€
- **Input**: 100 items @ €1.00 each = €100
- **Expected**: Requires approval
- **Status**: `pending`

### Test Case 3: Order Over 100€
- **Input**: 10 items @ €25.00 each = €250
- **Expected**: Requires approval
- **Status**: `pending`

### Test Case 4: Empty Cart
- **Input**: 0 items
- **Expected**: Validation error
- **Frontend**: Button disabled

## Troubleshooting

### Orders Not Auto-Approving

1. **Check if price is included in items**:
   ```json
   {
     "items": [
       { "price": 1.50 } // ← Must be present
     ]
   }
   ```

2. **Verify total_price column exists**:
   ```sql
   SELECT total_price FROM bestellungen LIMIT 1;
   ```

3. **Check backend logs** for calculation errors

### Pending Orders Not Showing

1. **Verify status in database**:
   ```sql
   SELECT id, status, total_price FROM bestellungen WHERE status = 'pending';
   ```

2. **Check API endpoint**:
   ```bash
   curl http://localhost:8001/api/v1/bestellungen/pending
   ```

---

**The automatic approval system is now ready to use!**

Orders under 100€ will be instantly approved, while larger orders will wait for admin review.
