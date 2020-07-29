const db = require('../models/Models');

const UserController = {};

UserController.getUserItems = (req, res, next) => {
  // console.log(`req.params.id`, req.params.user);
  const { user_id } = req.params;
  // console.log('user', user_id);

  const query = `SELECT u._id, u.email, I.*
  FROM public.users u
  RIGHT OUTER JOIN public.items i ON u._id=i.user_id
  WHERE u._id=${user_id}`;

  db.query(query, (err, data) => {
    if (err) {
      console.log('ERROR: ', err);
    }
    // if successful, query will return list of itmems that user has posted
    const { rows } = data;
    res.locals.items = rows;
    console.log('Successfully made GET request for all items that user has posted.');
    return next();
  });
};

UserController.createUser = async (req, res, next) => {
  const { email, password, firstName, lastName, zipCode, street, city, state } = req.body;
  try {
    // if user is in database, send res of user exists
    const findUser = `SELECT email, password FROM users WHERE (email = '${email}');`;
    const user = await db.query(findUser);
    if (user.rows[0]) return res.status(200).send(`${email} already exists`);

    // create address in db
    const createAddressQuery = {
      text:
        'INSERT INTO public.address(zipcode, street, city, state) VALUES($1, $2, $3, $4) RETURNING *',
      values: [zipCode, street, city, state],
    };
    const address = await db.query(createAddressQuery);

    // create user, use incoming address_id
    const createUserQuery = {
      text:
        'INSERT INTO public.users("email", "firstName", "lastName", "password", "address_id") VALUES($1, $2, $3, $4, $5) RETURNING *',
      values: [email, firstName, lastName, password, address.rows[0]._id],
    };

    const newUser = await db.query(createUserQuery);

    // console.log('successfully create email', email);
    // send data back to client

    return next();
    // res.status(200).json({ user: newUser.rows[0], adress: address.rows[0] });

    // res.redirect('/login')
  } catch (e) {
    return next(e);
    // console.log(e);
    // res.redirect('/register')
  }
};

UserController.verifyUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const findUser = `SELECT _id, email, password FROM users WHERE (email = '${email}');`;
    const user = await db.query(findUser);
    if (password === user.rows[0].password) {
      return next();
    }
    if (password !== user.rows[0].password) {
      return next({ log: 'Incorrect password' });
    }
  } catch (e) {
    return next({ log: 'Error returned, invalid username' });
  }
};

module.exports = UserController;