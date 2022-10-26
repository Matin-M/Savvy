module.exports = {
  apps: [
    {
      name: 'Savvy',
      cwd: './src/',
      script: './index.js',
      args: '',
      watch: false,
      node_args: '',
      exec_mode: 'fork',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: '../ProcessLogs/stderr-logs.txt',
      out_file: '../ProcessLogs/stdout-logs.txt',
      autorestart: true,
    },
  ],
};
