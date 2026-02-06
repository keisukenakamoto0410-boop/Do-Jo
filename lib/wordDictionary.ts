// 日本語単語の読み仮名と英語訳の辞書
// よく使われる単語のみ登録。登録されていない単語はそのまま表示

export interface WordInfo {
  reading: string; // 読み仮名（ひらがな）
  meaning: string; // 英語の意味
}

// 単語辞書（漢字/カタカナ → 読み仮名 + 英語訳）
export const wordDictionary: Record<string, WordInfo> = {
  // 形容詞
  おいしい: { reading: "おいしい", meaning: "delicious" },
  美味しい: { reading: "おいしい", meaning: "delicious" },
  楽しい: { reading: "たのしい", meaning: "fun, enjoyable" },
  嬉しい: { reading: "うれしい", meaning: "happy, glad" },
  面白い: { reading: "おもしろい", meaning: "interesting, funny" },
  難しい: { reading: "むずかしい", meaning: "difficult" },
  易しい: { reading: "やさしい", meaning: "easy" },
  優しい: { reading: "やさしい", meaning: "kind, gentle" },
  暑い: { reading: "あつい", meaning: "hot (weather)" },
  寒い: { reading: "さむい", meaning: "cold (weather)" },
  熱い: { reading: "あつい", meaning: "hot (thing)" },
  冷たい: { reading: "つめたい", meaning: "cold (thing)" },
  高い: { reading: "たかい", meaning: "high, expensive" },
  安い: { reading: "やすい", meaning: "cheap" },
  大きい: { reading: "おおきい", meaning: "big" },
  小さい: { reading: "ちいさい", meaning: "small" },
  新しい: { reading: "あたらしい", meaning: "new" },
  古い: { reading: "ふるい", meaning: "old" },
  良い: { reading: "よい", meaning: "good" },
  いい: { reading: "いい", meaning: "good" },
  悪い: { reading: "わるい", meaning: "bad" },
  忙しい: { reading: "いそがしい", meaning: "busy" },
  眠い: { reading: "ねむい", meaning: "sleepy" },
  疲れた: { reading: "つかれた", meaning: "tired" },

  // 名詞 - 食べ物
  料理: { reading: "りょうり", meaning: "cooking, dish" },
  食べ物: { reading: "たべもの", meaning: "food" },
  飲み物: { reading: "のみもの", meaning: "drink" },
  野菜: { reading: "やさい", meaning: "vegetable" },
  果物: { reading: "くだもの", meaning: "fruit" },
  肉: { reading: "にく", meaning: "meat" },
  魚: { reading: "さかな", meaning: "fish" },
  寿司: { reading: "すし", meaning: "sushi" },
  ラーメン: { reading: "らーめん", meaning: "ramen" },
  天ぷら: { reading: "てんぷら", meaning: "tempura" },
  弁当: { reading: "べんとう", meaning: "bento, lunch box" },
  朝ご飯: { reading: "あさごはん", meaning: "breakfast" },
  昼ご飯: { reading: "ひるごはん", meaning: "lunch" },
  晩ご飯: { reading: "ばんごはん", meaning: "dinner" },
  夕食: { reading: "ゆうしょく", meaning: "dinner" },

  // 名詞 - 場所
  旅行: { reading: "りょこう", meaning: "travel, trip" },
  観光: { reading: "かんこう", meaning: "sightseeing" },
  駅: { reading: "えき", meaning: "station" },
  空港: { reading: "くうこう", meaning: "airport" },
  電車: { reading: "でんしゃ", meaning: "train" },
  飛行機: { reading: "ひこうき", meaning: "airplane" },
  ホテル: { reading: "ほてる", meaning: "hotel" },
  旅館: { reading: "りょかん", meaning: "Japanese inn" },
  温泉: { reading: "おんせん", meaning: "hot spring" },
  神社: { reading: "じんじゃ", meaning: "Shinto shrine" },
  お寺: { reading: "おてら", meaning: "Buddhist temple" },
  公園: { reading: "こうえん", meaning: "park" },
  山: { reading: "やま", meaning: "mountain" },
  海: { reading: "うみ", meaning: "sea, ocean" },
  川: { reading: "かわ", meaning: "river" },

  // 名詞 - 時間・季節
  春: { reading: "はる", meaning: "spring" },
  夏: { reading: "なつ", meaning: "summer" },
  秋: { reading: "あき", meaning: "autumn, fall" },
  冬: { reading: "ふゆ", meaning: "winter" },
  桜: { reading: "さくら", meaning: "cherry blossom" },
  紅葉: { reading: "もみじ/こうよう", meaning: "autumn leaves" },
  花火: { reading: "はなび", meaning: "fireworks" },
  祭り: { reading: "まつり", meaning: "festival" },
  正月: { reading: "しょうがつ", meaning: "New Year" },
  今日: { reading: "きょう", meaning: "today" },
  明日: { reading: "あした", meaning: "tomorrow" },
  昨日: { reading: "きのう", meaning: "yesterday" },
  週末: { reading: "しゅうまつ", meaning: "weekend" },

  // 名詞 - 家族
  家族: { reading: "かぞく", meaning: "family" },
  父: { reading: "ちち", meaning: "father (humble)" },
  母: { reading: "はは", meaning: "mother (humble)" },
  兄: { reading: "あに", meaning: "older brother" },
  姉: { reading: "あね", meaning: "older sister" },
  弟: { reading: "おとうと", meaning: "younger brother" },
  妹: { reading: "いもうと", meaning: "younger sister" },
  子供: { reading: "こども", meaning: "child" },
  両親: { reading: "りょうしん", meaning: "parents" },
  祖父: { reading: "そふ", meaning: "grandfather" },
  祖母: { reading: "そぼ", meaning: "grandmother" },

  // 名詞 - 趣味・娯楽
  趣味: { reading: "しゅみ", meaning: "hobby" },
  映画: { reading: "えいが", meaning: "movie" },
  音楽: { reading: "おんがく", meaning: "music" },
  本: { reading: "ほん", meaning: "book" },
  読書: { reading: "どくしょ", meaning: "reading" },
  スポーツ: { reading: "すぽーつ", meaning: "sports" },
  サッカー: { reading: "さっかー", meaning: "soccer" },
  野球: { reading: "やきゅう", meaning: "baseball" },
  写真: { reading: "しゃしん", meaning: "photo" },
  ゲーム: { reading: "げーむ", meaning: "game" },
  散歩: { reading: "さんぽ", meaning: "walk, stroll" },
  買い物: { reading: "かいもの", meaning: "shopping" },

  // 名詞 - 仕事
  仕事: { reading: "しごと", meaning: "work, job" },
  会社: { reading: "かいしゃ", meaning: "company" },
  学校: { reading: "がっこう", meaning: "school" },
  大学: { reading: "だいがく", meaning: "university" },
  先生: { reading: "せんせい", meaning: "teacher" },
  学生: { reading: "がくせい", meaning: "student" },
  会議: { reading: "かいぎ", meaning: "meeting" },
  電話: { reading: "でんわ", meaning: "telephone" },
  メール: { reading: "めーる", meaning: "email" },

  // 動詞
  食べる: { reading: "たべる", meaning: "to eat" },
  飲む: { reading: "のむ", meaning: "to drink" },
  見る: { reading: "みる", meaning: "to see, watch" },
  聞く: { reading: "きく", meaning: "to listen, ask" },
  話す: { reading: "はなす", meaning: "to speak, talk" },
  読む: { reading: "よむ", meaning: "to read" },
  書く: { reading: "かく", meaning: "to write" },
  行く: { reading: "いく", meaning: "to go" },
  来る: { reading: "くる", meaning: "to come" },
  帰る: { reading: "かえる", meaning: "to return" },
  買う: { reading: "かう", meaning: "to buy" },
  する: { reading: "する", meaning: "to do" },
  遊ぶ: { reading: "あそぶ", meaning: "to play" },
  寝る: { reading: "ねる", meaning: "to sleep" },
  起きる: { reading: "おきる", meaning: "to wake up" },
  作る: { reading: "つくる", meaning: "to make" },
  歩く: { reading: "あるく", meaning: "to walk" },
  走る: { reading: "はしる", meaning: "to run" },
  泳ぐ: { reading: "およぐ", meaning: "to swim" },
  勉強する: { reading: "べんきょうする", meaning: "to study" },
  練習する: { reading: "れんしゅうする", meaning: "to practice" },

  // 挨拶・表現
  ありがとう: { reading: "ありがとう", meaning: "thank you" },
  すみません: { reading: "すみません", meaning: "excuse me, sorry" },
  ごめんなさい: { reading: "ごめんなさい", meaning: "I'm sorry" },
  お願いします: { reading: "おねがいします", meaning: "please" },
  大丈夫: { reading: "だいじょうぶ", meaning: "OK, all right" },
  頑張る: { reading: "がんばる", meaning: "to do one's best" },
  頑張って: { reading: "がんばって", meaning: "good luck, do your best" },

  // その他
  日本: { reading: "にほん", meaning: "Japan" },
  日本語: { reading: "にほんご", meaning: "Japanese language" },
  英語: { reading: "えいご", meaning: "English" },
  天気: { reading: "てんき", meaning: "weather" },
  時間: { reading: "じかん", meaning: "time" },
  お金: { reading: "おかね", meaning: "money" },
  友達: { reading: "ともだち", meaning: "friend" },
  人: { reading: "ひと", meaning: "person" },
  物: { reading: "もの", meaning: "thing" },
  所: { reading: "ところ", meaning: "place" },
  名前: { reading: "なまえ", meaning: "name" },
  意味: { reading: "いみ", meaning: "meaning" },
  質問: { reading: "しつもん", meaning: "question" },
  答え: { reading: "こたえ", meaning: "answer" },
};

/**
 * 単語の情報を取得
 * 辞書に登録されていない場合は、単語をそのまま読み仮名として返す
 */
export function getWordInfo(word: string): { word: string; reading: string; meaning: string | null } {
  const normalizedWord = word.trim();
  const info = wordDictionary[normalizedWord];

  if (info) {
    return {
      word: normalizedWord,
      reading: info.reading,
      meaning: info.meaning,
    };
  }

  // 辞書にない場合
  return {
    word: normalizedWord,
    reading: normalizedWord, // ひらがな/カタカナの場合はそのまま表示
    meaning: null,
  };
}

/**
 * 複数の単語の情報を取得
 */
export function getWordsInfo(words: string[]): { word: string; reading: string; meaning: string | null }[] {
  return words.map(getWordInfo);
}
