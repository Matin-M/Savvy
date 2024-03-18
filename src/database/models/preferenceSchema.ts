import Sequelize from 'sequelize';

export default {
  guildId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  key: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  value: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  classId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
};
