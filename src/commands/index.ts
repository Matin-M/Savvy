import ICommand from '../types/Command';
import VoiceUpdates from './VoiceUpdates';
import SetUpdateChannel from './SetUpdateChannel';
import SetJoinRole from './SetJoinRole';
import ServerInfo from './ServerInfo';
import GetGameStats from './GetGameStats';
import audioCommandList from './AudioCommands';
import AddRole from './AddRole';
import SetRoles from './SetRoles';
import AccountInfo from './AccountInfo';
import BulkDelete from './BulkDelete';
import BotLatency from './BotLatency';
import ProxyDM from './ProxyDM';
import RunBashCommand from './RunBashCommand';
import ReplyOnKeyword from './ReplyOnKeyword';
import ActivityStats from './PresenceStats';
import ChatStats from './ChatStats';
import GetGameStatsForAll from './GetGameStatsForAll';
import UserServerInfo from './user/ServerInfo';

const commandList = [
  VoiceUpdates,
  SetUpdateChannel,
  SetJoinRole,
  ServerInfo,
  GetGameStats,
  GetGameStatsForAll,
  ...audioCommandList,
  AddRole,
  SetRoles,
  AccountInfo,
  BulkDelete,
  BotLatency,
  ProxyDM,
  RunBashCommand,
  ReplyOnKeyword,
  ActivityStats,
  ChatStats,
  UserServerInfo,
];

export default commandList as [ICommand];
