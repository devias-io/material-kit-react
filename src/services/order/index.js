// Mock data
import orders from 'data/orders';
import users from 'data/users';

function lookupOrder(order) {
  order.customer = users.find(user => user.id === order.customer);

  return order;
}

export const getOrders = (limit = 6) => {
  return new Promise(resolve => {
    const ordersLookup = JSON.parse(JSON.stringify(orders))
      .slice(0, limit)
      .map(lookupOrder);

    setTimeout(() => {
      resolve({
        orders: ordersLookup,
        ordersTotal: orders.length
      });
    }, 700);
  });
};
