const { NextRequest } = require('next/server');
const req = new NextRequest('http://localhost:1441', {
  headers: {
    cookie: 'bb_customer_info=%7B%22id%22%3A%22123%22%2C%22name%22%3A%22Semesta%20Setiawan%22%2C%22email%22%3A%22semestasetiawan20%40gmail.com%22%2C%22avatarUrl%22%3A%22https%3A%2F%2Flh3.googleusercontent.com%2Fa%2FACg8ocLWOACxsXSKdw1TrCUpHjpIhz-IHnQelm9hSWhtPqNvWayd3w%3Ds96-c%22%7D'
  }
});
console.log('req.cookies.get:', req.cookies.get('bb_customer_info')?.value);
