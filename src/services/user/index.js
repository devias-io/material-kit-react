// Mock data
import users from 'data/users';
import orders from 'data/orders';

function lookupUser(user) {
  const userCopy = JSON.parse(JSON.stringify(user));
  const userOrders = userCopy.orders.map(id =>
    orders.find(order => order.id === id)
  );
  const userMoneySpent = userCopy.orders.reduce(
    (total, order) => total + order.amount,
    0
  );

  userCopy.orders = userOrders;
  userCopy.moneySpent = userMoneySpent;

  return userCopy;
}

export const getUsers = (limit = 10) => {
  return new Promise(resolve => {
    setTimeout(() => {
      const usersLookup = users.slice(0, limit).map(lookupUser);

      resolve({
        users: usersLookup,
        usersTotal: users.length
      });
    }, 700);
  });
};

export const getUser = id => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users.find(user => user.id === id);

      if (user) {
        resolve({
          user: lookupUser(user)
        });
      } else {
        reject({
          error: 'User not found'
        });
      }
    }, 500);
  });
};
