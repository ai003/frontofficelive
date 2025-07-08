import type { User, Post, Comment } from '../types';

export const users: User[] = [
  {
    id: '1',
    name: 'CoachMike',
    role: 'admin'
  },
  {
    id: '2',
    name: 'StatsGuru23',
    role: 'user'
  },
  {
    id: '3',
    name: 'DraftExpert',
    role: 'user'
  }
];

export const posts: Post[] = [
  {
    id: '1',
    title: 'Breaking Down Luka Dončić\'s Triple-Double Efficiency',
    content: 'Luka has been averaging 28.7 PPG, 8.1 RPG, and 7.6 APG this season with a true shooting percentage of 58.2%. His clutch performance in the 4th quarter has been exceptional, shooting 47% from three in the final 5 minutes. What makes his triple-doubles so impactful is his ability to create for teammates while maintaining elite scoring efficiency. The Mavs are 23-4 when he records a triple-double.',
    author: users[1],
    createdAt: new Date('2024-01-15T10:30:00Z'),
    tags: ['NBA', 'Stats', 'Mavericks', 'Triple-Double']
  },
  {
    id: '2',
    title: 'Why the Lakers Should Target Dejounte Murray at the Trade Deadline',
    content: 'The Lakers desperately need a secondary playmaker who can defend multiple positions. Murray is averaging 5.8 APG and 1.4 SPG while shooting 36% from three. His contract ($17.7M) makes him accessible, and the Hawks might be sellers. Pairing him with LeBron and AD creates a formidable Big 3. The Lakers could offer Rui, Gabe Vincent, and a 2029 first-round pick.',
    author: users[0],
    createdAt: new Date('2024-01-10T14:20:00Z'),
    tags: ['NBA', 'Trade', 'Lakers', 'Murray']
  },
  {
    id: '3',
    title: '2024 Draft Sleeper: Stephon Castle (UConn)',
    content: 'Castle is flying under the radar but has all the tools to be a lottery pick. At 6\'6" with a 6\'9" wingspan, he\'s got prototypical size for a modern guard. His defense is already elite - 1.8 SPG and incredible switchability. Offensively, he\'s shooting 38% from three over his last 15 games. His ceiling is a Jrue Holiday type two-way impact player. Mock drafts have him going 18-25, but I think he goes top 15.',
    author: users[2],
    createdAt: new Date('2024-01-08T16:45:00Z'),
    tags: ['Draft', 'UConn', 'Sleeper', 'Defense']
  },
  {
    id: '4',
    title: 'The Art of Pick and Roll Defense: Drop vs Switch',
    content: 'Modern NBA offenses exploit pick and roll coverage more than ever. Drop coverage works against non-shooters but gets torched by elite guards like Curry and Lillard. Switching neutralizes the screen but creates mismatches - think Gobert on Kyrie. The key is having versatile defenders who can execute both schemes. Teams like Boston excel because they can switch 1-5 with Smart, Brown, Tatum, Williams, and Horford.',
    author: users[0],
    createdAt: new Date('2024-01-05T11:15:00Z'),
    tags: ['Strategy', 'Defense', 'Pick-and-Roll', 'Coaching']
  },
  {
    id: '5',
    title: 'Victor Wembanyama\'s Impact on Defensive Metrics',
    content: 'Wemby is already transforming the Spurs defense in his rookie season. His 2.8 BPG leads the league, but the advanced metrics tell the real story. San Antonio\'s defensive rating improves by 8.4 points per 100 possessions when he\'s on the floor. His rim protection (opponents shooting 41% at the rim vs him) combined with perimeter switchability is unprecedented for a 7\'4" player. He\'s redefining what\'s possible at his size.',
    author: users[1],
    createdAt: new Date('2024-01-03T09:00:00Z'),
    tags: ['Rookie', 'Defense', 'Spurs', 'Advanced-Stats']
  }
];

export const comments: Comment[] = [
  {
    id: '1',
    postId: '1',
    content: 'Those clutch numbers are insane! Luka really steps up when it matters most. His shot selection in the 4th has improved so much from his rookie year.',
    author: users[2],
    createdAt: new Date('2024-01-15T11:00:00Z'),
    parentId: null
  },
  {
    id: '2',
    postId: '1',
    content: 'The triple-double record correlation is fascinating. Shows how his playmaking directly translates to team success.',
    author: users[0],
    createdAt: new Date('2024-01-15T11:30:00Z'),
    parentId: null
  },
  {
    id: '3',
    postId: '1',
    content: 'Exactly! And when he gets teammates involved early, it opens up his scoring opportunities later in the game.',
    author: users[1],
    createdAt: new Date('2024-01-15T12:00:00Z'),
    parentId: '2'
  },
  {
    id: '4',
    postId: '2',
    content: 'Murray makes sense, but what about his injury history? He missed significant time last season with that ankle.',
    author: users[2],
    createdAt: new Date('2024-01-10T15:00:00Z'),
    parentId: null
  },
  {
    id: '5',
    postId: '2',
    content: 'Fair point, but when healthy he\'s exactly what they need. His defense would be huge alongside AD.',
    author: users[1],
    createdAt: new Date('2024-01-10T15:30:00Z'),
    parentId: '4'
  },
  {
    id: '6',
    postId: '3',
    content: 'Castle is legit! Watched him lock down Purdue\'s guards in the tournament. That wingspan is special.',
    author: users[0],
    createdAt: new Date('2024-01-08T17:15:00Z'),
    parentId: null
  },
  {
    id: '7',
    postId: '4',
    content: 'This is why coaching matters so much. Having players who can execute multiple schemes is key to playoff success.',
    author: users[1],
    createdAt: new Date('2024-01-05T12:00:00Z'),
    parentId: null
  },
  {
    id: '8',
    postId: '4',
    content: 'Absolutely. The Warriors\' success in 2015-2022 was built on this versatility. Death lineup could switch everything.',
    author: users[2],
    createdAt: new Date('2024-01-05T12:30:00Z'),
    parentId: '7'
  },
  {
    id: '9',
    postId: '5',
    content: 'That 8.4 defensive rating improvement is wild for a rookie. Shows how much impact a true rim protector has.',
    author: users[0],
    createdAt: new Date('2024-01-03T10:00:00Z'),
    parentId: null
  },
  {
    id: '10',
    postId: '5',
    content: 'He\'s already changing how teams approach the Spurs offensively. Fewer drives to the rim, more contested threes.',
    author: users[2],
    createdAt: new Date('2024-01-03T10:30:00Z'),
    parentId: null
  }
];