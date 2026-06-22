import { PLAN_AMOUNTS } from '../config/paymentConfig'

export const PLANS = {
  normal: {
    id: 'normal',
    name: 'Normal Sensi',
    price: PLAN_AMOUNTS.normal,
    description: 'A complete device-specific setup for smoother, more consistent aim.',
    features: ['Sensitivity Settings', 'Device Settings', 'Accessibility Settings', 'Developer Settings', 'DPI Guide'],
  },
  premium: {
    id: 'premium',
    name: 'Premium Sensi',
    price: PLAN_AMOUNTS.premium,
    description: 'Our deepest optimization package for competitive players.',
    features: ['Everything in Normal', 'Premium Optimization', '5 Premium App Setup/Edit Commands', 'Priority Delivery', 'Extra Support'],
  },
}

export const PLAN_LIST = Object.values(PLANS)
