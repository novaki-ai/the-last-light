# Audio assets — Novaki: The Last Light

All music and spoken performances were created with the supplied `varlik` command. No downloaded audio, other generators, or synthesized music were used. Eight original music cues and twelve original voice clips were generated. The voice quota used is 12 of 25.

The initial music attempts failed because the tool resolved an isolated home directory without its Gemini credential. Subsequent invocations omitted HOME from the child environment so the installed tool could resolve the existing user configuration. No credential was printed, copied, or changed.

Files are in `public/assets/audio/`. Every cue is available as the original generated OGG and an MP3 compatibility copy transcoded from that OGG with FFmpeg. `manifest.json` supplies durations, filenames, exact dialogue, performer voice, and provenance. The MP3 files are recommended for broad browser playback; OGG originals remain available. Assets use local relative paths only.

## Music

All music is instrumental, approximately 30.77 seconds per cue. Prompts requested seamless or loopable form, original melodies, polished production, and no vocals. For smoother repeated playback, use a short crossfade at the loop boundary if supported by the audio engine. Generated music may have natural phrase transitions at the seam; exact sample-perfect composition loops are not claimed.

| ID | Intended scene | Direction |
| --- | --- | --- |
| menu | Main menu, introduction | 82 BPM; warm felt piano, cello, music-box details, dark hopeful fairytale |
| stage1 | Cinderwild | 116 BPM; driving pizzicato strings, marimba, earthy drums, dulcimer |
| stage2 | The Drowned Archive | 124 BPM; glass marimba, celesta, watery textures, pulsing bass |
| stage3 | The Hollow Sun | 134 BPM; surging strings, analog arpeggios, brass, heroic bells |
| boss1 | The Briar Warden | 146 BPM; galloping low strings, taiko, woody percussion, low brass |
| boss2 | Mother of Tides | 140 BPM; sinister celesta, strings, heavy toms, glass and dark harp |
| boss3 | The Hollow Sun | 152 BPM; orchestral percussion, blazing brass, violins, guitar accents |
| victory | Ending and victory screen | 84 BPM; hopeful piano, tender cello, glockenspiel, luminous strings |

Music peaks are near full scale with mean level around -14.3 dBFS. Suggested playback gain is approximately 0.25–0.4, ducked to 0.08–0.12 during spoken lines. Voice peaks vary naturally with the characters' performances; suggested voice gain is 0.9–1.0.

## Voices

| ID | Voice and direction | Exact dialogue |
| --- | --- | --- |
| intro | Sulafat; warm, wise female storyteller | They said a burnt match had nothing left to give. But when the last lantern went dark, Novaki still carried a spark. |
| novaki-start | Puck; small, brave, dry gentle wit | Still got a little spark. |
| boss1-intro | Algenib; ancient, gravelly woodland guardian | Little ember. This forest has buried brighter things than you. |
| boss1-phase | Algenib; furious battle cry | Then let the roots remember fire! |
| boss1-death | Algenib; exhausted, tender rediscovery | I remember... the warmth. |
| boss2-intro | Gacrux; regal, eerily soothing sea witch | Hush, little flame. Every story ends beneath the tide. |
| boss2-phase | Gacrux; supernatural wrath | Let the drowned pages turn! |
| boss2-death | Gacrux; weakened, astonished acceptance | One story... remains unwritten. |
| boss3-intro | Orus; colossal, arrogant cosmic god | I swallowed the dawn. What can one burnt match do? |
| boss3-phase | Orus; commanding cosmic rage | All light returns to me! |
| boss3-death | Orus; awe replacing arrogance | So small... so bright. |
| ending | Sulafat; moving, hopeful storyteller | A match only burns once. Or so the world believed. Novaki did not bring back the old sun. He taught the dark to make a little room for everyone. |

## Verification

FFprobe verified valid Vorbis OGG audio, 44.1 kHz stereo music and 48 kHz mono voices. FFmpeg decoded each asset without errors and measured non-silent audio. MP3 copies are derived from these files and individually decoded. This is technical validation; no claim of human listening review is made.
