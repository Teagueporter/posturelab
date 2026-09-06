export const stripeWebhookEvent = {
  checkoutSessionCompleted: "checkout.session.completed",
  subscriptionCreated: "customer.subscription.created",
  subscriptionUpdated: "customer.subscription.updated",
  subscriptionDeleted: "customer.subscription.deleted",
} as const;

export const stripeWebhookEvents = Object.values(stripeWebhookEvent);
