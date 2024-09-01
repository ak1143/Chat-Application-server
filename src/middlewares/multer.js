// multer is used to access the data that is given in the form-data 
// and with different file formats like text,file

import multer from "multer";

const multerUpload = multer({
    limits:{ fileSize : 1024 *1024 * 5}
});

export { multerUpload }