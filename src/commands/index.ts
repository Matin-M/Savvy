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

const commandList = [
  VoiceUpdates,
  SetUpdateChannel,
  SetJoinRole,
  ServerInfo,
  GetGameStats,
  ...audioCommandList,
  AddRole,
  SetRoles,
  AccountInfo,
  BulkDelete,
  BotLatency,
  ProxyDM,
  RunBashCommand,
  ReplyOnKeyword,
];

export default commandList as [ICommand];
