export type Stage = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  words: string[];
};

export const STAGES: Stage[] = [
  {
    id: 's1-animals',
    title: '동물 친구들',
    subtitle: 'Animals',
    emoji: '🐶',
    color: 'from-emerald-400 to-teal-500',
    words: [
      'cat', 'dog', 'bird', 'fish', 'horse',
      'cow', 'pig', 'duck', 'chicken', 'rabbit',
      'bear', 'lion', 'tiger', 'elephant', 'monkey',
      'mouse', 'frog', 'fox', 'snake', 'turtle',
    ],
  },
  {
    id: 's2-food',
    title: '맛있는 음식',
    subtitle: 'Food',
    emoji: '🍎',
    color: 'from-red-400 to-pink-500',
    words: [
      'apple', 'banana', 'grapes', 'orange', 'strawberry',
      'watermelon', 'pear', 'lemon', 'bread', 'cheese',
      'egg', 'milk', 'juice', 'cake', 'cookie',
      'pizza', 'sandwich', 'rice', 'candy', 'soup',
    ],
  },
  {
    id: 's3-things',
    title: '생활 속 물건',
    subtitle: 'Things',
    emoji: '✏️',
    color: 'from-amber-400 to-orange-500',
    words: [
      'ball', 'book', 'pencil', 'crayons', 'scissors',
      'eraser', 'chair', 'table', 'bed', 'door',
      'window', 'clock', 'lamp', 'key', 'umbrella',
      'hat', 'shoe', 'sock', 'cup', 'spoon',
    ],
  },
  {
    id: 's4-body-nature',
    title: '몸과 자연',
    subtitle: 'Body & Nature',
    emoji: '☀️',
    color: 'from-sky-400 to-blue-500',
    words: [
      'eye', 'ear', 'nose', 'mouth', 'hand',
      'foot', 'leg', 'sun', 'moon', 'star',
      'cloud', 'rain', 'snow', 'rainbow', 'tree',
      'flower', 'rose', 'leaf', 'ocean', 'heart',
    ],
  },
  {
    id: 's5-world',
    title: '세상 탐험',
    subtitle: 'World Around Us',
    emoji: '🚗',
    color: 'from-violet-400 to-purple-500',
    words: [
      'car', 'bus', 'truck', 'boat', 'ship',
      'van', 'house', 'school', 'teacher', 'family',
      'mother', 'boy', 'girl', 'man', 'woman',
      'king', 'queen', 'robot', 'ring', 'zoo',
    ],
  },
  {
    id: 's6-more-animals',
    title: '더 많은 동물',
    subtitle: 'More Animals',
    emoji: '🦁',
    color: 'from-teal-400 to-cyan-500',
    words: [
      'bee', 'butterfly', 'owl', 'spider', 'panda',
      'penguin', 'kangaroo', 'koala', 'octopus', 'whale',
      'hippo', 'sheep', 'hen', 'zebra', 'shark',
      'dolphin', 'giraffe', 'deer', 'goat', 'squirrel',
    ],
  },
  {
    id: 's7-sweet-snacks',
    title: '달콤한 간식',
    subtitle: 'Sweet Snacks',
    emoji: '🍔',
    color: 'from-rose-400 to-red-500',
    words: [
      'pineapple', 'corn', 'tomato', 'potato', 'nut',
      'yogurt', 'lollipop', 'burger', 'fries', 'hotdog',
      'donut', 'popcorn', 'noodles', 'sushi', 'taco',
      'pie', 'butter', 'avocado', 'cherry', 'peach',
    ],
  },
  {
    id: 's8-home-kitchen',
    title: '집 안 물건',
    subtitle: 'Home & Kitchen',
    emoji: '🍽️',
    color: 'from-orange-400 to-amber-500',
    words: [
      'fork', 'knife', 'glass', 'box', 'fan',
      'jar', 'pen', 'pot', 'pan', 'bag',
      'plate', 'bottle', 'can', 'desk', 'map',
      'kite', 'net', 'nest', 'paper', 'ink',
    ],
  },
  {
    id: 's9-clothes-music',
    title: '옷과 악기',
    subtitle: 'Clothes & Music',
    emoji: '🎸',
    color: 'from-indigo-400 to-violet-500',
    words: [
      'cap', 'shirt', 'pants', 'dress', 'coat',
      'scarf', 'gloves', 'boot', 'tie', 'skirt',
      'glasses', 'tooth', 'piano', 'drum', 'guitar',
      'trumpet', 'violin', 'microphone', 'bell', 'ring',
    ],
  },
  {
    id: 's10-rides-places',
    title: '탈것과 장소',
    subtitle: 'Rides & Places',
    emoji: '✈️',
    color: 'from-sky-400 to-indigo-500',
    words: [
      'bicycle', 'scooter', 'airplane', 'train', 'tractor',
      'motorcycle', 'helicopter', 'rocket', 'taxi', 'ambulance',
      'police', 'firetruck', 'beach', 'mountain', 'castle',
      'tent', 'circus', 'hospital', 'park', 'bridge',
    ],
  },
];

export function getStage(id: string): Stage | undefined {
  return STAGES.find((s) => s.id === id);
}
