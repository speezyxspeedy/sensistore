export const PLANS = {
  normal: {
    id: 'normal',
    name: 'Normal Sensi',
    price: 199,
    description: 'A complete device-specific setup for smoother, more consistent aim.',
    features: ['Sensitivity Settings', 'Device Settings', 'Accessibility Settings', 'Developer Settings', 'DPI Guide'],
  },
  premium: {
    id: 'premium',
    name: 'Premium Sensi',
    price: 499,
    description: 'Our deepest optimization package for competitive players.',
    features: ['Everything in Normal', 'Premium Optimization', '5 Premium App Setup/Edit Commands', 'Priority Delivery', 'Extra Support'],
  },
}

export const PLAN_LIST = Object.values(PLANS)
