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
  messageId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  contents: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  editedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  channelName: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  channelId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  type: {
    type: Sequelize.STRING,
    allowNull: true,
  },
};
