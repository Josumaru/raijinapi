import { responses, baseUrl } from "../constants/responses.js"
import { apiResponse, fetchServer } from "../helpers/services.js"
import { load } from "cheerio";
import axios from "axios";


const getAnime = async (req, res) => {
    console.log(new Date())
    const data = [];
    const page = req.params.page == 0 ? 1 : req.params.page;
    const status = req.params.status
    const url = `${baseUrl}/${status}-anime/page/${page}`

    const pages = [];
    try {
        let response = await fetchServer(url, res)
        if (response.status == 200) {
            console.log(response.status);
            const $ = load(response.data);

            const paginations = $(".pagenavix");

            paginations.find("a").each((index, pagination) => {
                const page = $(pagination).attr("href");
                pages.push({ page })
            })

            const elements = $(".venz");
            elements.find("ul > li").each((index, element) => {
                const title = $(element).find("h2").text().trim();
                const thumbnail = $(element).find("img").attr("src").trim();
                const endpoint = $(element).find("a").attr("href").trim().replace(`${baseUrl}/anime/`, "").trim();
                const date = $(element).find(".newnime").text().trim();
                let episode;
                if (status == "ongoing") {
                    episode = parseInt($(element).find(".epz").text().trim().split(" ")[1]);
                } else {
                    episode = parseInt($(element).find(".epz").text().trim().split(" ")[0]);
                }

                data.push({
                    index,
                    title,
                    thumbnail,
                    endpoint,
                    date,
                    episode,
                })
            })
            return apiResponse(res, responses.success.code, data, page, pages);
        }
        return apiResponse(res, responses.error.code);
    } catch (error) {
        console.log(error)
        return apiResponse(res, responses.error.code);
    }
}


const getDetail = async (req, res) => {
    console.log(new Date())
    let data = {};
    const endpoint = req.params.endpoint
    const url = `${baseUrl}/anime/${endpoint}`
    try {
        const response = await fetchServer(url);
        if (response.status == 200) {
            let info = ["title", "japanese", "score", "producer", "type", "status", "total_episode", "duration", "release_date", "studio", "genre"];
            let synopsis = "";
            const $ = load(response.data);
            const elements = $(".venser")

            // Details
            elements.each((index, element) => {
                const details = $(element);
                details.find("p > span").each((index, detail) => {
                    data[info[index]] = $(detail).text().split(": ")[1]
                        .replace("Min.", "")
                        .replace("Menit", "")
                        .replace("min.", "")
                        .replace("per ep.", "")
                        .replace("min. per ep.", "")
                        .trim();
                })
                details.find(".fotoanime > img").each((index, detail) => {
                    data["thumbnail"] = $(detail).attr("src");
                })

                details.find(".sinopc > p").each((index, detail) => {
                    synopsis += $(detail).text();
                })
                data["synopsis"] = synopsis;
            });

            // Episode List
            elements.each((index, element) => {
                const episodes = $(element);
                const episode_list = [];
                episodes.find(".episodelist > ul > li").each((index, episode) => {
                    let endpoint = $(episode).find("span > a").attr("href");
                    let title = $(episode).find("span > a").text().replace("Subtitle Indonesia", "");
                    let date = $(episode).find(".zeebr").text();
                    if (endpoint.replace(baseUrl, "").split("/")[1] == "episode") {
                        endpoint = endpoint.replace(`${baseUrl}/episode/`, "");
                        date = date.replace(",", ", ");
                        const segments = endpoint.split("-");
                        let episode_endpoint;
                        for(let segment of segments) {
                            let episodeMatch = segment.match(/(\d+)/);
                            if(episodeMatch) episode_endpoint = parseInt(episodeMatch[1]);
                        }
                        episode_list.push({ title, endpoint, date,  episode_endpoint})
                    }
                })
                data["episodes"] = episode_list;
            });
        }
        return apiResponse(res, responses.success.code, data);
    } catch (error) {
        console.log(error)
        return apiResponse(res, responses.error.code);
    }
}



const getStream = async (req, res) => {
    console.log(new Date())
    let data = {};
    let video = [];
    let part = 1;
    let season = 1;
    let episode = "";
    const endpoint = req.params.endpoint;
    const segments = endpoint.split("-");
    let codename = segments[0];
    console.log(segments);
    for(let segment of segments) {
        let seasonMatch = segment.match(/s(\d+)/);
        let partMatch = segment.match(/p(\d+)/);
        let episodeMatch = segment.match(/(\d+)/)
        if (seasonMatch) season = parseInt(seasonMatch[1]);
        if (partMatch) part = parseInt(partMatch[1]);
        if (episodeMatch) episode = parseInt(episodeMatch[1]);
    }

    const url = `${baseUrl}/episode/${endpoint}`;

    try {
        const response = await fetchServer(url)
        if (response.status == 200) {
            const $ = load(response.data);
            const elements = $(".download")
            const promises = [];
            elements.find("ul > li > a").each((index, element) => {
                const quality = $(element).text();
                const mirror = $(element).attr("href");
                if (quality.toLocaleLowerCase() == "kfiles" || quality.toLocaleLowerCase() == "kraken") {
                    const location = axios.head(mirror).then(res => res.request["res"]["responseUrl"]);
                    promises.push(location);
                }
            })
            const stream = (await Promise.all(promises)).filter(Boolean);


            // 403 Issue
            for (let i = 0; i < stream.length; i++) {
                try {
                    const mirrorResponse = await fetchServer(stream[i]);
                    if (mirrorResponse.status == 200) {
                        const $ = load(mirrorResponse.data);
                        const endpoint = `https:${($("video").attr("data-src-url"))}`;
                        const poster = `https:${$("video").attr("poster")}`;
                        
                        video.push({
                            endpoint, 
                            poster, 
                            episode,
                            codename,
                            season,
                            part,
                        });
                    }
                } catch (error) {
                    console.log(error);
                }
            }
            console.log(video);
            data = video;
        }

        return apiResponse(res, responses.success.code, data);
    } catch (error) {
        console.log(error)
        return apiResponse(res, responses.error.code);
    }
}

const getMirror = async (req, res) => {
    console.log(new Date())
    let data = {};
    let part = 1;
    let season = 1;
    let episode = "";
    const endpoint = req.params.endpoint;
    const segments = endpoint.split("-");
    let codename = segments[0];
    console.log(segments);
    for(let segment of segments) {
        let seasonMatch = segment.match(/s(\d+)/);
        let partMatch = segment.match(/p(\d+)/);
        let episodeMatch = segment.match(/(\d+)/)
        if (seasonMatch) season = parseInt(seasonMatch[1]);
        if (partMatch) part = parseInt(partMatch[1]);
        if (episodeMatch) episode = parseInt(episodeMatch[1]);
    }

    const url = `${baseUrl}/episode/${endpoint}`;

    try {
        const response = await fetchServer(url)
        if (response.status == 200) {
            const $ = load(response.data);
            const elements = $(".download")
            const promises = [];
            elements.find("ul > li > a").each((index, element) => {
                const quality = $(element).text();
                const mirror = $(element).attr("href");
                if (quality.toLocaleLowerCase() == "kfiles" || quality.toLocaleLowerCase() == "kraken") {
                    const location = axios.head(mirror).then(res => res.request["res"]["responseUrl"]);
                    promises.push(location);
                }
            })
            const stream = (await Promise.all(promises)).filter(Boolean);
            for (let i = 0; i < stream.length; i++) {
                stream[i] = {
                    endpoint: stream[i],
                    episode,
                    codename,
                    season,
                    part,
                }
            }
            data = stream;
        }

        return apiResponse(res, responses.success.code, data);
    } catch (error) {
        console.log(error)
        return apiResponse(res, responses.error.code);
    }
}



export { getAnime, getDetail, getStream, getMirror };
