import axios from "axios";
import { load } from "cheerio";

const apiResponse = (response, status, data, page, pages) => {
    return response.status(status).json(
        {
            status,
            data,
            page,
            pages,
        },
    );
}


const fetchServer = async (url, res) => {
    const response = await axios(url)
    try {
        return new Promise((resolve, reject) => {
            if (response.status == 200) resolve(response);
            reject(response);
        })
    } catch (error) {
        return ({
            status: false,
            code: 404,
            message: "bad request"
        })
    }
}


const loader = (url, ) => {
    const $ = load(url);
    res.send()
}


export { apiResponse, fetchServer, loader };