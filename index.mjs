import { YouTubeVideo } from "node-tube-dl";
import prompt from "prompt-sync";
import fs from "fs";
import { exec } from "child_process";

const main = async () => {
    const url = prompt()("Enter the URL of the YouTube video: ");
    const folderName = prompt()("Enter the name of the folder: ");
    const folderPath = "downloads/" + folderName;

    // Création du dossier de destination
    fs.mkdirSync(folderPath);

    // Téléchargement de la vidéo
    console.log("Downloading...");
    let videoDuration = await youtubeDownloader(url, "1080p", folderPath);
    
    fs.mkdirSync(folderPath + "/parts");
    const iterations = await videoSegmenter(folderPath + "/video.mp4", folderPath + "/parts", videoDuration);
    console.log("Video segmented into " + iterations.length + " parts !");
}
const videoSegmenter = async (inputPath, outputPath, videoDuration) => {
    const segmentDuration = 90; // Durée de chaque segment en secondes
    const segments = [];
    let startTime = 0;
    let segmentIndex = 1;

    const segmentVideo = async (startTime) => {
        const outputFileName = `part${segmentIndex}.mp4`;
        const outputFilePath = `${outputPath}/${outputFileName}`;
        const remainingDuration = videoDuration - startTime;
        const durationToExport = Math.min(segmentDuration, remainingDuration);

        try {
            exec(`ffmpeg -ss ${startTime} -i "${inputPath}" -t ${durationToExport} -c:v copy -c:a copy "${outputFilePath}`);
            console.log(`Segment ${segmentIndex} created`);
            segments.push(outputFileName);
            segmentIndex++;
            startTime += durationToExport;

            if (startTime < videoDuration) {
                // Appel récursif pour segmenter la vidéo suivante
                await segmentVideo(startTime);
            }
        } catch (error) {
            console.error(`Error segmenting video at ${startTime} seconds: ${error.message}`);
            throw error;
        }
    };

    // Commencez la segmentation de la vidéo
    await segmentVideo(startTime);

    return segments;
}

const youtubeDownloader = async (url, quality, dirPath) => {
    const video =  await new YouTubeVideo(url)
        .quality(quality)
        .outdir(dirPath)
        .filename("video")
        .download();

    if(video == null) {
        console.log("Error while downloading the video !");
        return;
    } else {
        return video.duration.seconds;
    }
};

main();
