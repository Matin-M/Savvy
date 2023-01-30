import Sequelize from 'sequelize';

export default {
  guildId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  userId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  timeStamp: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  type: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  url: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  details: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  state: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  largeText: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  smallText: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  userStatus: {
    type: Sequelize.STRING,
    allowNull: true,
  },
};
