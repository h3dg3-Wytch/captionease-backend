
## Formatting

Extract MP3 from video

```bash
ffmpeg -i sample.mp4 -q:a 0 -map a sample.mp3
```

Encode SRT files to video

```bash
ffmpeg -i sample.mp4 -vf "subtitles=subtitles.srt:force_style='Name=Default,Fontname=Arial,Fontsize=14,PrimaryColour=&Hffffff,SecondaryColour=&Hffffff,OutlineColour=&H44000000BackColour=&H0,BorderStyle=4,Shadow=0'" out.mp4
```

Assembly API requests

```bash
curl --request POST \
  --url https://api.assemblyai.com/v2/transcript \
  --header 'authorization: xxx' \
  --header 'content-type: application/json' \
  --data '{"audio_url": "https://transcribe-audio-test-cj.s3-eu-west-1.amazonaws.com/test-ts-podcast.mp3", "acoustic_model": "assemblyai_en_uk"}'


curl --request GET \
  --url https://api.assemblyai.com/v2/transcript/84q4hgjka-782f-4040-acb5-80090eea88cf \
  --header 'authorization: xxx' \
  --header 'content-type: application/json'


curl --request GET \
  --url https://api.assemblyai.com/v2/transcript/84q4hgjka-782f-4040-acb5-80090eea88cf/srt \
  --header 'authorization: xxx' \
  --header 'content-type: application/json'
```