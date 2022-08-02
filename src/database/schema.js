const Sequelize = require("sequelize");

module.exports = {
  guildId: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  updateChannel: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "general",
  },
  self_assign_roles: {
    type: Sequelize.ARRAY(Sequelize.DataTypes.STRING),
    allowNull: false,
  },
  joinRole: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "NA",
  },
  displayLeaveMessages: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  voice_subscribers_list: {
    type: Sequelize.ARRAY(Sequelize.DataTypes.STRING),
    allowNull: false,
  },
  message_reply_phrases: {
    type: Sequelize.ARRAY(Sequelize.DataTypes.STRING),
    allowNull: false,
  },
  message_reply_keywords: {
    type: Sequelize.ARRAY(Sequelize.DataTypes.STRING),
    allowNull: false,
  },
};
