require('dotenv').config()
const client = require('twilio')(process.env.ACCOUNT_SERVICESID, process.env.AUTH_SERVICESID);
const serviceSid = process.env.TWILIO_SERVICESID

module.exports = {
    dosms: (noData) => {
        let res = {}
        return new Promise(async (resolve, reject) => {
            try {
                client.verify.services(serviceSid).verifications.create({
                    to: `+91${noData.mobile}`,
                    channel: "sms"
                }).then(() => {
                    // res.valid = true;
                    resolve()
                    // console.log(res);
                })
            } catch (error) {
                reject(error)
            }
        })
    },
    otpVerify: (otpData, nuData) => {
        // let resp = {}
        return new Promise(async (resolve, reject) => {
            try {
                let err = "Enter a valid Otp"
                client.verify.services(serviceSid).verificationChecks.create({
                    to: `+91${nuData.mobile}`,
                    code: otpData.otp
                }).then((res) => {
                    if (res.valid) {
                        resolve()
                    } else {
                        reject(err)
                    }

                })
            } catch (error) {
                reject(error)
            }
        })
    }

}