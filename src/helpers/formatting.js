const msToTime = (ms) => {
  const seconds = (ms / 1000).toFixed(1);
  const minutes = (ms / (1000 * 60)).toFixed(1);
  const hours = (ms / (1000 * 60 * 60)).toFixed(1);
  const days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
  if (seconds < 60) return `${seconds} Sec`;
  else if (minutes < 60) return `${minutes} Min`;
  else if (hours < 24) return `${hours} Hrs`;
  else return `${days} Days`;
};

const wordFreq = (strings) => {
  const freqMap = {};
  strings.forEach((string) => {
    const words = string.replace(/[.]/g, '').split(/\s/);
    words.forEach((w) => {
      if (w.includes('https://') || w === '' || !w) return;
      if (!freqMap[w]) {
        freqMap[w] = 0;
      }
      freqMap[w] += 1;
    });
  });
  return freqMap;
};

const keySort = (arr, formatter) => {
  let freqTable = '';
  Object.keys(arr)
    .sort((a, b) => {
      return arr[b] - arr[a];
    })
    .forEach((item, index) => {
      index < 15
        ? (freqTable += `${formatter(item)} → ${arr[item]}\n`)
        : undefined;
    });
  return freqTable;
};

exports.msToTime = msToTime;
exports.wordFreq = wordFreq;
exports.keySort = keySort;
