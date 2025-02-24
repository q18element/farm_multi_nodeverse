import csv from "csvtojson";


csv().fromFile("./input/proxy.csv").then((data) => console.log(data));