export const generateRandomOTP = (length = 4)=> {
   let str =  "";
   for(let i = 0; i < 4; i++) {
    str+=Math.floor(Math.random() * 10);// 09
   }
   return str;
}