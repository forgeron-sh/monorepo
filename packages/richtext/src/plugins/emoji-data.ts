// The emoji the picker knows: a compact table written for this package (names and keywords are
// ours, the characters are plain Unicode). No dependency. Only the `emoji` plugin and the
// `emojiPicker` helper import this module, so an app that uses neither never loads it.
//
// One line per emoji: the character, a name (what `:name` matches), then keywords. `# group` starts
// a group. Single code points only, so a name never depends on a font's ligatures.

const TABLE = `
# faces
😀 grinning happy smile face
😃 smiley happy joy open mouth
😄 smile happy joy laugh
😁 grin beaming teeth happy
😆 laughing satisfied squint haha
😅 sweat_smile relief nervous laugh
😂 joy tears laughing lol funny
🙂 slight_smile fine okay calm
🙃 upside_down silly sarcasm irony
😉 wink flirt joke
😊 blush happy shy pleased
😇 innocent angel halo
😍 heart_eyes love adore crush
🤩 star_struck wow amazed excited
😘 kissing_heart kiss love
😋 yum tasty delicious tongue
😛 tongue playful silly
😜 wink_tongue crazy joke
🤪 zany wild goofy crazy
🤔 thinking hmm wonder consider
🤨 raised_eyebrow doubt skeptical suspicious
😐 neutral expressionless meh
😑 expressionless blank flat
😶 no_mouth silent speechless
🙄 eye_roll annoyed whatever
😏 smirk smug sly
😣 persevere struggle effort
😥 sad_relieved disappointed phew
😮 open_mouth surprised wow
🤐 zipper_mouth secret quiet silent
😯 hushed surprised stunned
😪 sleepy tired nap
😴 sleeping zzz sleep tired
😌 relieved calm peaceful
😎 sunglasses cool confident
🤓 nerd geek glasses smart
😕 confused puzzled unsure
😟 worried anxious concerned
🙁 frown sad unhappy
😢 cry sad tear
😭 sob crying loudly sad
😤 triumph proud steam huffing
😠 angry mad annoyed
😡 rage furious red angry
🤯 mind_blown exploding head shocked
😱 scream fear shocked horror
😨 fearful scared afraid
😰 cold_sweat anxious nervous
😓 downcast_sweat tired hard work
🤗 hug hugging warm welcome
🤫 shush quiet secret
🤭 giggle oops hand over mouth
🥱 yawn bored tired
🥳 party celebrate birthday
🥺 pleading puppy eyes please
🥵 hot overheated sweating
🥶 cold freezing frozen
😷 mask sick ill medical
🤒 thermometer sick fever ill
🤕 bandage hurt injured
🤢 nauseated sick green
🤮 vomit sick throw up
🤧 sneeze cold allergy
😈 smiling_imp devil mischief
👻 ghost spooky halloween
💀 skull dead danger
🤖 robot bot machine
💩 poop funny
# people
👋 wave hello hi goodbye hand
🤚 raised_back_hand stop hand
✋ raised_hand stop high five
🖐 hand_splayed fingers spread
👌 ok_hand okay perfect
✌ victory peace two
🤞 crossed_fingers luck hope
🤟 love_you hand gesture
🤘 rock horns metal
👈 point_left left direction
👉 point_right right direction
👆 point_up up direction
👇 point_down down direction
👍 thumbs_up yes agree approve like plus
👎 thumbs_down no disagree dislike minus
✊ fist power solidarity
👊 punch fist bump
👏 clap applause bravo congrats
🙌 raised_hands celebrate hooray
🤝 handshake deal agreement partnership
🙏 pray thanks please hope folded hands
💪 muscle strong strength flex
👀 eyes look watch see
👁 eye see vision
🧠 brain mind smart think
👂 ear listen hear
👃 nose smell
👄 mouth lips
👶 baby child infant
🧒 child kid young
👦 boy kid
👧 girl kid
🧑 person adult
👨 man male adult
👩 woman female adult
🧓 older_person senior elder
👮 police officer cop
🕵 detective spy investigate
💂 guard
🥷 ninja stealth
👷 construction_worker builder helmet
👸 princess royal
🤴 prince royal
🦸 superhero hero power
🦹 supervillain villain
🧙 mage wizard magic
🧚 fairy magic
🧛 vampire
🧜 merperson mermaid
🧝 elf
🧞 genie wish
🧟 zombie
🙋 raising_hand question volunteer
🙇 bow sorry respect
🤷 shrug unsure dunno
🤦 facepalm oops disbelief
💁 information_desk help sassy
🚶 walking walk
🏃 running run exercise
💃 dancer dance party
🕺 man_dancing dance party
# nature
🐶 dog puppy pet
🐱 cat kitten pet
🐭 mouse rodent
🐹 hamster pet
🐰 rabbit bunny
🦊 fox clever
🐻 bear
🐼 panda
🐨 koala
🐯 tiger
🦁 lion king
🐮 cow
🐷 pig
🐸 frog
🐵 monkey
🙈 see_no_evil monkey
🙉 hear_no_evil monkey
🙊 speak_no_evil monkey
🐔 chicken hen
🐧 penguin
🐦 bird tweet
🐤 chick baby bird
🦆 duck
🦉 owl wise night
🦇 bat night
🐺 wolf
🐴 horse
🦄 unicorn magic fantasy
🐝 bee honey busy
🐛 bug caterpillar insect
🦋 butterfly pretty
🐌 snail slow
🐞 lady_beetle ladybug
🐜 ant
🕷 spider
🐢 turtle slow
🐍 snake python
🦎 lizard
🐙 octopus
🦑 squid
🦀 crab
🐠 tropical_fish fish
🐟 fish
🐬 dolphin
🐳 whale
🦈 shark
🐊 crocodile
🐘 elephant
🦒 giraffe
🌵 cactus desert
🎄 christmas_tree holiday
🌲 evergreen_tree pine forest
🌳 tree deciduous forest
🌴 palm_tree tropical beach
🌱 seedling sprout grow plant
🌿 herb leaf plant
🍀 four_leaf_clover luck lucky
🍁 maple_leaf autumn fall canada
🍂 fallen_leaf autumn fall
🌸 cherry_blossom flower spring
🌹 rose flower love
🌻 sunflower flower
🌼 blossom flower
🌷 tulip flower
💐 bouquet flowers gift
🍄 mushroom
🌍 earth_europe world globe planet
🌎 earth_americas world globe planet
🌏 earth_asia world globe planet
🌙 crescent_moon night moon
🌕 full_moon night
⭐ star favorite
🌟 glowing_star shine sparkle
✨ sparkles new magic shine clean
⚡ zap lightning fast power electric
🔥 fire hot flame lit trending
💧 droplet water drop
🌊 water_wave wave ocean sea water
☀ sun sunny weather bright
⛅ partly_sunny cloud weather
☁ cloud weather
🌧 rain cloud weather
⛈ storm thunder weather
❄ snowflake cold winter snow
☃ snowman winter
🌈 rainbow colors pride
☔ umbrella rain
# food
🍎 apple red fruit
🍏 green_apple fruit
🍐 pear fruit
🍊 orange tangerine fruit
🍋 lemon fruit sour
🍌 banana fruit
🍉 watermelon fruit summer
🍇 grapes fruit wine
🍓 strawberry fruit berry
🍒 cherries fruit
🍑 peach fruit
🥭 mango fruit
🍍 pineapple fruit tropical
🥥 coconut tropical
🥝 kiwi fruit
🍅 tomato vegetable
🥑 avocado fruit
🍆 eggplant aubergine
🥕 carrot vegetable
🌽 corn maize
🌶 hot_pepper spicy chili
🥦 broccoli vegetable healthy
🥔 potato
🍞 bread toast loaf
🥐 croissant pastry french
🥖 baguette bread french
🧀 cheese
🥚 egg
🍳 cooking fried egg breakfast
🥞 pancakes breakfast
🥓 bacon breakfast
🍔 hamburger burger fast food
🍟 fries fast food
🍕 pizza food slice
🌭 hot_dog food
🌮 taco mexican food
🌯 burrito mexican food
🥗 salad healthy green
🍝 spaghetti pasta italian
🍜 ramen noodles soup
🍣 sushi japanese fish
🍤 shrimp tempura
🍙 rice_ball japanese
🍚 rice
🍦 ice_cream soft dessert
🍩 doughnut donut sweet
🍪 cookie biscuit sweet
🎂 birthday cake celebrate
🍰 shortcake cake dessert
🍫 chocolate sweet candy
🍬 candy sweet
🍭 lollipop sweet candy
🍿 popcorn movie snack
☕ coffee tea hot drink cafe
🍵 tea green drink
🥛 milk glass drink
🍺 beer drink pub
🍻 beers cheers drink
🥂 champagne cheers toast celebrate
🍷 wine drink red
🍸 cocktail drink bar
🥤 cup_straw soda drink
🍽 plate fork knife dining
🥄 spoon eat
🔪 knife kitchen cut
# activity
⚽ soccer football sport ball
🏀 basketball sport ball
🏈 american_football sport ball
⚾ baseball sport ball
🎾 tennis sport ball
🏐 volleyball sport ball
🏉 rugby sport ball
🎱 pool billiards eight ball
🏓 ping_pong table tennis sport
🏸 badminton sport
🥊 boxing glove sport
⛳ golf flag sport
🏆 trophy win winner prize champion
🥇 gold_medal first win winner
🥈 silver_medal second
🥉 bronze_medal third
🏅 medal sport award
🎯 target goal bullseye aim dart
🎮 video_game gaming controller play
🎲 dice game random
🧩 puzzle piece jigsaw
🎸 guitar music rock
🎹 piano keyboard music
🎷 saxophone music jazz
🎺 trumpet music
🥁 drum music
🎤 microphone sing karaoke
🎧 headphones music audio
🎵 musical_note music song
🎶 notes music song
🎬 clapper movie film action
🎨 palette art paint design
🎭 performing_arts theater drama masks
🎪 circus tent
🎉 tada party celebrate congrats hooray
🎊 confetti ball party celebrate
🎈 balloon party birthday
🎁 gift present surprise birthday
🎀 ribbon bow gift
# travel
🚗 car automobile drive vehicle
🚕 taxi cab vehicle
🚌 bus vehicle transport
🚎 trolleybus vehicle transport
🏎 racing_car fast speed
🚓 police_car vehicle
🚑 ambulance emergency vehicle
🚒 fire_engine truck emergency
🚚 delivery_truck shipping vehicle
🚜 tractor farm vehicle
🚲 bike bicycle cycling
🛴 scooter kick vehicle
🏍 motorcycle motorbike vehicle
🚂 locomotive train steam
🚆 train vehicle rail
🚄 bullet_train fast rail
✈ airplane plane flight travel
🛫 takeoff departure flight
🛬 landing arrival flight
🚀 rocket launch ship fast space startup
🛸 flying_saucer ufo alien
🚁 helicopter vehicle
⛵ sailboat boat sea
🚢 ship boat cruise
⚓ anchor ship port
⛽ fuel_pump gas petrol
🚦 traffic_light signal
🚧 construction work barrier
🏠 house home building
🏡 house_garden home
🏢 office building work
🏥 hospital medical building
🏦 bank building money
🏫 school building education
🏭 factory industry building
🏰 castle building
🗼 tower tokyo landmark
🗽 statue_of_liberty new york landmark
⛰ mountain nature hike
🏔 snow_mountain nature
🏕 camping tent nature
🏖 beach umbrella holiday
🏝 desert_island holiday tropical
🌅 sunrise morning
🌆 cityscape evening city
🌃 night_stars city
🗺 world_map travel plan
🧭 compass navigate direction
# objects
⌚ watch time clock
📱 phone mobile smartphone
💻 laptop computer work
🖥 desktop computer screen
⌨ keyboard type
🖱 computer_mouse mouse computer click
💾 floppy_disk save storage
💿 cd disc
📷 camera photo picture
📹 video_camera record film
📺 tv television screen
📻 radio audio
🔋 battery power charge
🔌 plug electric power
💡 bulb idea light tip
🔦 flashlight torch light
🕯 candle light
🧯 extinguisher fire safety
💰 money_bag cash rich
💵 dollar cash money banknote
💶 euro cash money banknote
💳 credit_card payment bank
🧾 receipt invoice bill
📦 package box parcel shipping
📫 mailbox mail post
✉ envelope mail email letter
📧 email mail message
📝 memo note write pencil
📄 page document file
📃 page_curl document file
📑 bookmark_tabs tabs document
📊 bar_chart stats analytics data graph
📈 chart_up growth increase trend
📉 chart_down decrease decline
📋 clipboard list checklist
📌 pushpin pin location important
📍 round_pushpin location pin map
📎 paperclip attachment clip
📏 ruler measure straight
✂ scissors cut
🗂 card_index_dividers organize folders
📁 file_folder directory folder
📂 open_folder directory folder
🗃 card_file_box archive
🗄 file_cabinet archive storage
🗑 wastebasket trash delete bin
🔒 lock secure private closed
🔓 unlock open unlocked
🔑 key access password
🗝 old_key access
🔨 hammer build tool
🛠 tools build fix repair
🔧 wrench tool fix settings
⚙ gear settings cog config
🧰 toolbox tools
🧲 magnet attract
🔬 microscope science research
🔭 telescope space astronomy
💊 pill medicine health
💉 syringe vaccine medical
🧪 test_tube science chemistry experiment
🧬 dna science biology
📚 books reading library study
📖 open_book reading
📕 closed_book red book
📗 green_book book
📘 blue_book book
📙 orange_book book
🔖 bookmark save tag
🏷 label tag price
🔍 magnifier search find zoom
🔎 magnifier_right search find zoom
🔔 bell notification alert ring
🔕 bell_off mute silent notification
📣 megaphone announce loud
📢 loudspeaker announce
💬 speech_bubble chat comment message
💭 thought_bubble think idea
🗨 speech_left chat comment
🕐 clock time hour
⏰ alarm_clock wake time
⏳ hourglass time wait
⌛ hourglass_done time
📅 calendar date schedule
📆 tear_off_calendar date schedule
🗓 spiral_calendar date plan
# symbols
❤ heart love red
🧡 orange_heart love
💛 yellow_heart love
💚 green_heart love
💙 blue_heart love
💜 purple_heart love
🖤 black_heart love
🤍 white_heart love
💔 broken_heart sad love
💕 two_hearts love
💖 sparkling_heart love
💯 hundred perfect score 100
💢 anger mad
💥 boom collision bang
💫 dizzy star
💦 sweat_drops water
💤 zzz sleep tired
✅ white_check_mark done yes success complete check
☑ ballot_check done checked
✔ check_mark done yes correct
❌ cross_mark no wrong error delete
❎ cross_mark_button no
➕ plus add more
➖ minus remove less
➗ divide division
✖ multiply times
❓ question what ask help
❔ white_question what
❗ exclamation important warning alert
❕ white_exclamation important
‼ double_exclamation important
⚠ warning caution alert danger
🚫 prohibited forbidden no ban
⛔ no_entry stop forbidden
🛑 stop_sign stop halt
ℹ information info about
♻ recycle green environment
⭕ hollow_red_circle ring circle
🔴 red_circle red dot
🟠 orange_circle orange dot
🟡 yellow_circle yellow dot
🟢 green_circle green dot ok
🔵 blue_circle blue dot
🟣 purple_circle purple dot
⚫ black_circle black dot
⚪ white_circle white dot
🟥 red_square red
🟧 orange_square orange
🟨 yellow_square yellow
🟩 green_square green
🟦 blue_square blue
🟪 purple_square purple
⬆ arrow_up up direction
⬇ arrow_down down direction
⬅ arrow_left left direction back
➡ arrow_right right direction next
↗ arrow_upper_right up right
↘ arrow_lower_right down right
🔄 arrows_counterclockwise refresh reload sync
🔁 repeat loop again
🔀 shuffle random mix
▶ play forward start
⏸ pause wait
⏹ stop square
⏩ fast_forward skip
⏪ rewind back
🔼 up_button up
🔽 down_button down
🆕 new fresh
🆗 ok okay
🆒 cool
🔝 top up best
🔜 soon coming
🏁 checkered_flag finish race
🚩 triangular_flag flag mark
🏳 white_flag surrender
🏴 black_flag
🌐 globe_meridians world web internet
🔗 link chain url connect
🔐 locked_key secure
🛡 shield protect security
🔰 beginner new learn
👑 crown king queen royal
💎 gem diamond precious
💣 bomb danger explosive
🎩 top_hat magic fancy
👓 glasses eyewear
🕶 dark_glasses sunglasses cool
🧢 cap hat
👕 tshirt shirt clothes
👖 jeans pants clothes
👟 sneaker shoe running
👜 handbag bag
🎒 backpack school bag
💼 briefcase work business job
☂ umbrella_open rain
`;

/** One emoji of the table. */
export interface EmojiEntry {
  /** The Unicode text, what is inserted. */
  readonly char: string;
  /** What `:name` types: lower case, words joined with `_`. */
  readonly name: string;
  /** Other words that find it. */
  readonly keywords: readonly string[];
  /** The group it is listed under (`faces`, `people`, `nature`...). */
  readonly group: string;
}

/** Characters a font may draw as text unless the variation selector asks for the emoji. */
const TEXT_DEFAULT: ReadonlySet<string> = new Set(
  "✌❤☀☁⌨✉ℹ✔✖▶⏸⏹⬆⬇⬅➡↗↘✈☂☃❄⚙⚠♻☑‼✂⛰🖐🕷🌧⛈🗺🗓🗂🗃🗄🗑🖥🖱🕯🏷🛠🛡🗝🏎🏍🏔🏕🏖🏝🍽🌶🕶🕵🗨👁",
);

function parse(table: string): EmojiEntry[] {
  const out: EmojiEntry[] = [];
  let group = "faces";
  for (const raw of table.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      group = line.slice(1).trim();
      continue;
    }
    const [char, name, ...keywords] = line.split(/\s+/);
    if (char && name) {
      out.push({ char: TEXT_DEFAULT.has(char) ? `${char}\uFE0F` : char, name, keywords, group });
    }
  }
  return out;
}

/** Every emoji of the table, in the order of its groups. */
export const EMOJI: ReadonlyArray<EmojiEntry> = parse(TABLE);
