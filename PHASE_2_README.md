# WorkPlex Phase 2 - Home Dashboard UI

## 📦 What's Been Built

A complete, production-grade Home Dashboard for WorkPlex by HVRS Innovations with real-time data, smooth animations, and perfect user experience.

---

## 📁 File Structure

```
src/
├── components/
│   └── dashboard/
│       ├── HomeDashboard.tsx          # Main dashboard container
│       ├── TopBar.tsx                 # User profile, wallet, streak
│       ├── CouponCard.tsx             # Coupon code with countdown
│       ├── AIEarningsPredictor.tsx    # AI prediction banner
│       ├── TaskCard.tsx               # Individual task card
│       ├── TaskListPreview.tsx        # Task list (max 3 tasks)
│       ├── LeadMarketerProgress.tsx   # Progress to Lead Marketer
│       ├── MysteryBonusModal.tsx      # Random bonus popup
│       ├── AnnouncementBanner.tsx     # Scrolling announcements
│       ├── BottomNav.tsx              # Bottom navigation bar
│       ├── SkeletonLoader.tsx         # Loading skeletons
│       └── index.ts                   # Component exports
├── hooks/
│   └── useFirestore.ts                # Real-time Firestore hooks
├── utils/
│   └── dashboard.ts                   # Utility functions
```

---

## 🎨 Design System

### Colors
- **Background**: `#0A0A0A` (pure black)
- **Surface Cards**: `#111111` to `#1A1A1A` (dark gray)
- **Primary Accent (Gold)**: `#E8B84B`
- **Secondary Accent (Teal)**: `#00C9A7`
- **Success**: `#10B981`
- **Warning**: `#F59E0B`
- **Error**: `#EF4444`

### Typography
- Font Family: Inter (system font)
- Weights: 400 (normal), 600 (semibold), 700 (bold), 900 (black)

### Spacing & Borders
- Card Border Radius: `12px` (2xl in Tailwind)
- Button Border Radius: `8px` (xl in Tailwind)
- Touch Targets: Minimum `44px` height/width

---

## 🧩 Components Overview

### 1. **HomeDashboard** (Main Container)
- **Location**: `src/components/dashboard/HomeDashboard.tsx`
- **Purpose**: Orchestrates all dashboard sections
- **Features**:
  - Real-time Firestore listeners
  - Mystery bonus task trigger (15% chance)
  - Connection status monitoring
  - Toast notifications
  - Error handling with retry

### 2. **TopBar** (User Profile & Wallet)
- **Location**: `src/components/dashboard/TopBar.tsx`
- **Features**:
  - User profile photo with gold border
  - User name + venture badge
  - Earned wallet balance (large gold text)
  - Today's earnings
  - Streak counter with animated fire icon

### 3. **CouponCard** (Conditional - Marketer/Content Creator Only)
- **Location**: `src/components/dashboard/CouponCard.tsx`
- **Features**:
  - Large monospace coupon code
  - 24-hour countdown progress bar (gold → red gradient)
  - Usage counter ("Used X times today")
  - WhatsApp share button
  - Expiry warning (red if < 4 hours)

### 4. **AIEarningsPredictor**
- **Location**: `src/components/dashboard/AIEarningsPredictor.tsx`
- **Features**:
  - Gold/teal gradient card with glow effect
  - Dynamic prediction text
  - "View Tasks" CTA button

### 5. **TaskCard**
- **Location**: `src/components/dashboard/TaskCard.tsx`
- **Features**:
  - Task title + venture badge
  - Earning amount (gold text)
  - Live countdown timer (HH:MM:SS)
  - Accept button (green)
  - Skip button (gray)
  - Hover lift effect

### 6. **TaskListPreview**
- **Location**: `src/components/dashboard/TaskListPreview.tsx`
- **Features**:
  - Horizontal scroll on mobile
  - Grid layout on web
  - Shows max 3 tasks
  - "View All" link
  - Empty state with illustration

### 7. **LeadMarketerProgress**
- **Location**: `src/components/dashboard/LeadMarketerProgress.tsx`
- **Features**:
  - Progress bar (gold fill)
  - Shows earned amount / Rs.50,000
  - Days active counter
  - Motivational text

### 8. **MysteryBonusModal**
- **Location**: `src/components/dashboard/MysteryBonusModal.tsx`
- **Features**:
  - 15% random trigger on load
  - Backdrop blur overlay
  - Scale-in animation
  - 2-hour countdown timer
  - Accept/Dismiss buttons
  - Toast notifications

### 9. **AnnouncementBanner**
- **Location**: `src/components/dashboard/AnnouncementBanner.tsx`
- **Features**:
  - Auto-rotating announcements (every 4 seconds)
  - Gold to teal gradient background
  - Pause on hover
  - Pagination dots

### 10. **BottomNav**
- **Location**: `src/components/dashboard/BottomNav.tsx`
- **Features**:
  - 4 tabs: Home, Tasks, Wallet, Profile
  - Active tab indicator (gold bar)
  - Smooth transitions
  - Touch-friendly (44px minimum)

### 11. **SkeletonLoader**
- **Location**: `src/components/dashboard/SkeletonLoader.tsx`
- **Features**:
  - Shimmer animation
  - Different types: topbar, coupon, predictor, task, progress, announcement
  - Progressive loading

---

## 🔥 Firestore Integration

### Custom Hooks (`src/hooks/useFirestore.ts`)

All hooks use `onSnapshot` for real-time updates:

1. **useUser(uid)** - User data listener
2. **useCoupon(uid)** - Coupon data listener
3. **useTasks(uid, venture, role, limit)** - Tasks listener
4. **useAnnouncements()** - Announcements listener
5. **useMonthlyEarnings(uid)** - Monthly earnings calculator

### Firestore Collections Expected:

```
users/{uid}
  ├── name: string
  ├── photoURL: string
  ├── venture: string
  ├── role: string
  ├── streak: number
  ├── wallets: { earned, pending, bonus, savings }
  ├── todayEarnings: number
  ├── monthlyEarnings: number
  ├── daysActiveThisMonth: number
  └── username: string

coupons/{uid}
  ├── code: string
  ├── venture: string
  ├── isActive: boolean
  ├── activatedAt: timestamp
  ├── expiresAt: timestamp
  ├── usageCount: number
  └── totalEarned: number

tasks/{taskId}
  ├── title: string
  ├── description: string
  ├── venture: string
  ├── role: string
  ├── earning: number
  ├── deadline: timestamp
  ├── status: string
  └── assignedTo: string | string[]

announcements/{id}
  ├── text: string
  ├── priority: number
  └── createdAt: timestamp
```

---

## ⚙️ Utility Functions (`src/utils/dashboard.ts`)

| Function | Purpose |
|----------|---------|
| `formatCurrency(amount)` | Format to "Rs.X,XXX" |
| `formatTime(seconds)` | Format to "HH:MM:SS" |
| `formatCountdown(milliseconds)` | Human-readable countdown |
| `calculateProgress(current, target)` | Percentage (0-100) |
| `getDaysActiveThisMonth(joinedAt)` | Days active counter |
| `calculateMonthlyEarnings(tasks)` | Sum tasks this month |
| `getTimeRemaining(deadline)` | Seconds until deadline |
| `getCouponExpiryProgress(activatedAt, expiresAt)` | Coupon progress (0-1) |
| `getHoursUntilExpiry(expiresAt)` | Hours until coupon expires |
| `formatRelativeTime(timestamp)` | "2h ago", "3d ago" |
| `generateWhatsAppLink(venture, code, link)` | WhatsApp share URL |
| `truncateText(text, maxLength)` | Truncate with ellipsis |
| `getRoleDisplayName(venture, role)` | Formatted role string |
| `getVentureColor(venture)` | Venture-specific color |
| `shouldShowCouponCard(role)` | Check if show coupon |
| `isReseller(role)` | Check if reseller role |

---

## 🎬 Animations

### Page Load
- Staggered fade-in for each section (0.1s delay)
- Top bar appears first
- Sections slide up sequentially

### Card Interactions
- Hover: `translateY(-4px)` lift effect
- Buttons: Ripple effect on click
- Smooth transitions (0.2s ease)

### Live Elements
- Fire emoji bounce every 5 seconds
- Countdown timer pulse when < 1 hour
- Mystery modal scale-in from center

### Mystery Modal
- Backdrop blur with dark overlay
- Spring animation for entrance
- Gift icon rotation animation

---

## 📱 Responsive Design

### Breakpoints
- **Mobile** (< 640px): Single column, horizontal scroll for tasks
- **Tablet** (640px - 1024px): 2-column grid for tasks
- **Desktop** (> 1024px): 3-column grid, wider layout

### Touch-Friendly
- All interactive elements: minimum 44px touch targets
- Large tap targets for buttons
- Swipe-friendly horizontal scroll

---

## ♿ Accessibility

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ High contrast text (WCAG AA compliant)
- ✅ Screen reader friendly
- ✅ Focus indicators
- ✅ Semantic HTML structure

---

## 🚀 Performance Optimizations

- ✅ Real-time listeners with proper cleanup
- ✅ `useMemo` for expensive calculations
- ✅ `useCallback` for event handlers
- ✅ Lazy loading for images
- ✅ Debounced scroll listeners (if needed)
- ✅ React.memo for static components

---

## 🐛 Error Handling

### Connection Issues
- "Reconnecting..." banner when Firestore disconnects
- Retry button with page reload
- Toast notifications for errors

### Empty States
- Friendly illustrations for empty tasks
- Helpful text guidance

### Firestore Errors
- Error boundaries catch unexpected errors
- Graceful fallbacks for missing data
- Console error logging (development only)

---

## 🔧 How to Use

### Import Components

```javascript
import HomeDashboard from './components/dashboard/HomeDashboard';
```

### Use in Routes

```javascript
<Route path="/home" element={<HomeDashboard user={user} />} />
```

### Props Required

```typescript
interface HomeDashboardProps {
  user: FirebaseUser; // Authenticated Firebase user
}
```

---

## 🎯 Business Rules Implemented

✅ Coupon card ONLY shows for Marketer/Content Creator
✅ Reseller sees product catalog shortcut instead
✅ All Firestore reads use onSnapshot (real-time)
✅ Mystery Bonus triggers at 15% chance on load
✅ All countdown timers are live (update every second)
✅ Smooth animations between sections
✅ Skeleton loading states while Firestore loads
✅ Error handling with retry buttons
✅ Mobile-first responsive design (320px - 1920px)

---

## 📝 Next Steps (Phase 3+)

- Task detail screen
- Full task list screen
- Wallet screen
- Profile screen
- Admin panel enhancements

---

## 🛠️ Dependencies Used

- React 18
- Framer Motion (animations)
- Lucide React (icons)
- React Hot Toast (notifications)
- Firebase Firestore (real-time data)
- Tailwind CSS (styling)
- React Router v6 (navigation)

---

## 📞 Support

For issues or questions about this implementation, contact the development team.

---

**Built with ❤️ for WorkPlex by HVRS Innovations**
