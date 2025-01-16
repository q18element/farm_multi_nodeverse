const Farm = require('./node_handler/automation');

async function main () {

  const exe = new Farm();

  // Call the run method to start the automation
  exe.run().then(() => {
    console.log("Farm automation completed.");
  }).catch(err => {
    console.error("Error running farm automation:", err);
  });

}

main()