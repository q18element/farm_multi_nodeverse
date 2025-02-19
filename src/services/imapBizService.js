const Imap = require('node-imap');
const ImapParser = require('imap').parseHeader;

// Extract OTP from the subject (e.g., "- 123456")
function extractOtpFromSubject(subject) {
  const otpRegex = /- (\d{6,})/;
  const match = otpRegex.exec(subject);
  return match ? match[1] : null;
}

// Open the inbox (Promise wrapper)
async function openInbox(imap) {
  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) reject(err);
      resolve(box);
    });
  });
}

// Fetch the latest unseen OTP from email
async function getLatestOtpForEmail(email, password) {
  const imapConfig = {
    user: email,
    password: password,
    host: 'imap.bizflycloud.vn',
    port: 993,
    tls: true,
  };

  const imap = new Imap(imapConfig);

  const timeout = setTimeout(() => {
    imap.end();
  }, 30000); // Timeout after 30 seconds

  return new Promise((resolve, reject) => {
    imap.once('ready', async () => {
      try {
        await openInbox(imap);

        const searchCriteria = ['UNSEEN', ['FROM', 'no-reply@web3auth.io']];
        const fetchLatestMail = (results) => {
          if (!results.length) {
            clearTimeout(timeout);
            imap.end();
            return resolve('No new messages');
          }

          // Always select the most recent UID (latest email)
          const latestId = Math.max(...results);

          const f = imap.fetch(latestId, {
            bodies: 'HEADER.FIELDS (FROM SUBJECT DATE)',
            struct: true,
          });

          f.on('message', (msg) => {
            msg.on('body', (stream) => {
              let buffer = '';
              stream.on('data', (chunk) => (buffer += chunk.toString('utf8')));

              stream.once('end', () => {
                const header = ImapParser(buffer);
                const otp = extractOtpFromSubject(header.subject[0]);

                clearTimeout(timeout);
                imap.end();
                resolve(otp || 'no otp');
              });
            });
          });

          f.once('error', (err) => {
            clearTimeout(timeout);
            imap.end();
            reject(`Fetch Error: ${err.message}`);
          });
        };

        if (imap.serverSupports('SORT')) {
          imap.sort(['ARRIVAL'], searchCriteria, (err, results) => {
            if (err) return reject(`SORT Error: ${err.message}`);
            fetchLatestMail(results);
          });
        } else {
          imap.search(searchCriteria, (err, results) => {
            if (err) return reject(`SEARCH Error: ${err.message}`);
            fetchLatestMail(results);
          });
        }
      } catch (error) {
        clearTimeout(timeout);
        imap.end();
        reject(`Unexpected Error: ${error.message}`);
      }
    });

    imap.once('error', (err) => {
      clearTimeout(timeout);
      reject(`IMAP Error: ${err.message}`);
    });

    imap.once('end', () => {
      // Optional: Log end event if needed
    });

    imap.connect();
  });
}

module.exports = {
  getLatestOtpForEmail,
};

// OPTIONAL: Test the function using an async IIFE (only for debugging purposes)
(async () => {
  try {
    const otp = await getLatestOtpForEmail('bull1000@tourzy.us', 'Rtn@2024');
    console.log('OTP:', otp);
  } catch (error) {
    console.error('Error:', error);
  }
})();
