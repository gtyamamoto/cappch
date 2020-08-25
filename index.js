const csv = require('csv-parser');
const fs = require('fs');
const csvFilePath = 'input.csv';
const _ = require('lodash');
const writeJsonFile = require('write-json-file');
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

(async () => {
    const fullOutput = [];
    fs.createReadStream(csvFilePath)
  .pipe(csv({mapHeaders: ({ header, index }) => header.toLowerCase() + index}))
  .on('data', (row) => {
     
    const dataPerson = {...parsePersonData(row),class:mapClassData(row),addresses:[...mapPhoneNumberData(row)]};
    fullOutput.push(dataPerson);
  })
  .on('end', async () => {
       
      await writeJsonFile('output.json',_.groupBy(fullOutput,'eid1'));
    console.log('CSV file successfully processed');
  });
   
})();

const parsePersonData = (row) => {
    return _.mapKeys(row,function(v, k) {
        return k.replace(/[0-9]/g, '');
      });
}



const validateClass = className => {
    return !_.isEmpty(className);
};



const mapClassData = (row) => {
    const classesRowNames = Object.keys(row).filter(rowName=>rowName.includes('class'));
    return _.chain(row)
    .pick( classesRowNames)
    .values()
    .filter(validateClass)
    .map(className=>className.trim().split(/,| \//).map(el=>el.trim()))
    .flattenDeep()
    ;
};

const mapPhoneNumberData = (row) => {
   
    return Object.keys(row)
    .filter(rowName=>rowName.includes('phone')&&isValidPhoneNumber(row[rowName]))
    .map(phoneKey=>{
        const phone = phoneUtil.parseAndKeepRawInput(row[phoneKey],'BR' );
        return {
            type: 'phone',
            tags : phoneKey.replace('phone','').split(/,| \//).map(el=>capitalize(
                el.trim().replace(/[0-9]/g, ''))),
            address :phone.getCountryCode()+phone.getNationalNumber()
        }
    })
};

const  capitalize = (s) => s[0].toUpperCase() + s.slice(1);

const isValidPhoneNumber = phone => {
    
    try {
        const numberParsed = phoneUtil.parseAndKeepRawInput(phone, 'BR');
        return phoneUtil.isPossibleNumber(numberParsed)
        && phoneUtil.isValidNumber(numberParsed) && phoneUtil.isValidNumberForRegion(numberParsed, 'BR');  
    } catch (error) {
        return false;
    }

};