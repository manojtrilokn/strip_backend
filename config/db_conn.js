const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.USER_NAME, process.env.PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // show query
});

sequelize.authenticate().then(() => {
    console.log('Connected to the DB.');
}).catch(err => {
    console.error('Unable to connect to the DB:', err);
});

// sequelize.sync();
sequelize.sync({ alter: true });  // alter table if any changes made in table
// sequelize.sync({force:true});   // delete all tables entry and create again
module.exports = sequelize; 