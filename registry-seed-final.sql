-- Final registry seed — ONLY games listed on starknet-gaming.com
-- Categories are the site's own taxonomy, not guessed. category_confirmed = true.
-- Run this INSTEAD OF registry-seed.sql (that file pulled in games not on the site).

insert into games (name, slug, category, url, category_confirmed) values ('Gaffer', 'gaffer', 'Sports / Fantasy', 'fantasy-sports-production-v1.up.railway.app', true) on conflict (slug) do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('gaffer', '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8', 'USDC', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('gaffer', '0x3dcf0ebba29b6912c239ed02e7f7b3e0d3e5df82f53d54a5507dc24738ce419', 'Gaffer League Vault', true) on conflict do nothing;

insert into games (name, slug, category, url, category_confirmed) values ('Ponziland', 'ponziland', 'Strategy / MMO', 'play.ponzi.land', true) on conflict (slug) do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x7e2dd623390edcbadde1def93aa6c8a1866c664273d9a4e5f8129a060d25916', 'PonziLand Systems', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x4270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f', 'AVNU', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x074238dfa02063792077820584c925b679a013cbab38e5ca61af5627d1eda736', 'Bonk Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x03b405a98c9e795d427fe82cdeeeed803f221b52471e3a757574a2b4180793ee', 'Starknet Brother Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac', 'Bitcoin Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x040e81cfeb176bfdbc5047bbc55eb471cfab20a6b221f38d8fda134e1bfffca4', 'Dog go to the moon dog Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x04fcaf2a7b4a072fe57c59beee807322d34ed65000d78611c909a46fead07fb1', 'Daydreams Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x075afe6402ad5a5c20dd25e10ec3b3986acaa647b77e4ae24b0cbc9a54a27a87', 'Ekubo Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', 'Ethereum Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49', 'Lords Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x049201f03a0f0a9e70e28dcd74cbf44931174dbe3cc4b2ff488898339959e559', 'Pain au lait', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x00acc2fa3bb7f6a6726c14d9e142d51fe3984dbfa32b5907e1e76425177875e2', 'Schizodio token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x0102d5e124c51b936ee87302e0f938165aec96fb6c2027ae7f3a5ed46c77573b', 'Starknet Sister Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x02ab526354a39e7f5d272f327fa94e757df3688188d4a92c6dc3623ab79894e2', 'Slay Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x01e70aedffd376afe33cebdf51ed5365131dccb2a5b2cb36d02b785442912b9b', 'Solana Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d', 'Starknet Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8', 'USDC Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('ponziland', '0x042dd777885ad2c116be96d4d634abc90a26a790ffb5871e037dd5ae7d2ec86b', 'SURVIVOR Token', false) on conflict do nothing;

insert into games (name, slug, category, url, category_confirmed) values ('Loot Survivor', 'loot-survivor', 'Roguelike / Dungeon', 'connect.provable.games', true) on conflict (slug) do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x0235fe8597adebb8cc6251797de251ba9fb95d9f13ecc53b8eb2734badf7df37', 'Game Core v2', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x023f86f5b4702f6ba114b82fb73448c58aad8f37a28b508b80bf129ee1edc405', 'Game Core', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x04de0351ceab4ecd50be6ee09329b0dcb3b96a9da88cc158f453823a389722fa', 'Game Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x046db77f066f1bec5ae53d2cf3686a262f308eb904e6b426251bcdf3a6bf34f0', 'Greed Dungeon', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x012ac35cf5112dd1bacd2f1e7342eb5951566262ab52c3c7dddd2b9a77840741', 'Hyper Greed Dungeon', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x0539d24dfdaa2866d975fa93db501b971c08786f2c88e719800be39903e43bbc', 'Beast Mode Dungeon', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x046da8955829adf2bda310099a0063451923f02e648cf25a1203aac6335cf0e4', 'Beasts', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x0337e25669f6cc7b81a507ebe0d908249cacad9b6e2c0fa43fecb6b6b04b109e', 'Karats Dungeon', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x045a1ef5f00a8b00e526d36a1d021b786db25ecf779e3fce391009571ead7fb9', 'Cambria Dungeon', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x00263cc540dac11334470a64759e03952ee2f84a290e99ba8cbc391245cd0bf9', 'Denshokan', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x03a664e858b0ae32105a7c433d23bf5f03a4a9237e66143b902c4684333e962e', 'Loot Survivor Lottery', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x00bcda5aa421e6ea01a9917839551db741eb260713cd35c6a8e6f1a1293fd0a5', 'Dungeon Entry Contract', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x01f2c86ab22ded7f2de9084578ce72a1f7b590d5be6bd5f912ac8053128c20c2', 'Budokan', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('loot-survivor', '0x06bd91881370deb7b7baf55e73bc4c4a37cd29009b491f9fa993dd897c9aba80', 'Black Shuck Dungeon', true) on conflict do nothing;

insert into games (name, slug, category, url, category_confirmed) values ('Dark Shuffle', 'dark-shuffle', 'Roguelike / Dungeon', 'darkshuffle.io', true) on conflict (slug) do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('dark-shuffle', '0x3451230bc1bbec7bb1f337f22c9f6699d238429638ac357dba53af193674c70', 'Dark Shuffle', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('dark-shuffle', '0x6e338bd8408dcd9d9ba3a116b5dd1737bcf566bdce2d823039368efcd66ca70', 'Dark Shuffle Battle Systems', true) on conflict do nothing;

insert into games (name, slug, category, url, category_confirmed) values ('Dope Wars', 'dope-wars', 'Card Games', 'dopewars.game', true) on conflict (slug) do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('dope-wars', '0x0410466536b5ae074f7fea81e5533b8134a9fa08b3dd077dd9db08f64997d113', 'Paper Token', false) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('dope-wars', '0x00cdc99c98deb5c91e9d2f1e3cf362cda3ad5c742a1987d21f8ac6b36de11877', 'Game Contract', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('dope-wars', '0x00a34c2b00f78ac4fec4400368961e75b9f003d847c445b3c3ff49ee9b0bfee7', 'Game Contract', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('dope-wars', '0x03cd4af3356c2c48eb4a900d0ade808e307c3b9eb8176e6a90d27b3469ff8b08', 'Laundromat Contract', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('dope-wars', '0x03ce0fd868ca6ecbb8ee204591f0565eb364dd01098e86e46656b095c1cdb126', 'Dope Loot Claim Contract', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('dope-wars', '0x0107aefe535adad25d91f77744bb37eca24d997e8216517736f06bbaea22d214', 'Dope Gear Contract', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('dope-wars', '0x0351f9dfb30e7ef8f283c61360145295d22621ac197b7a0d1f9094b52d71c605', 'Dope Hustlers Contract', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('dope-wars', '0x07652ca415b80a906ae739574104d217e953963917bffeb1ce7d5704b6ed057d', 'Dope Loot Contract', true) on conflict do nothing;

insert into games (name, slug, category, url, category_confirmed) values ('Blob Arena', 'blob-arena-amma', 'Action / PvP', '*.blobarena.xyz', true) on conflict (slug) do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('blob-arena-amma', '0x1bf9ad4efcfc9cdeefd3914960cd1e6ed9fd9e7d6c7a86243563b406ba462a1', 'Lobby Contract', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('blob-arena-amma', '0x4a242618b91bbb259d264fca06637947fda4caae1c9925b9f65188c1a7d7006', 'Game Contract', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('blob-arena-amma', '0x3d849c6271bdf30998bdba5e69100ff94f7d580d14c055fd771f58545552644', 'Arcade Contract', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('blob-arena-amma', '0x325921b454d1831ba13ee61dd3148cbd4b7dfeec2449ab60ce2d8bb09b7218e', 'AMMA Contract', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('blob-arena-amma', '0x674562426ddac305e5c53ed51004b7fce77bde3dc9a1ce562e1f6093e4f33c6', 'Classic Arcade Contract', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('blob-arena-amma', '0x23fcd0927479d5d1c2b1ff8bde1c6689616669c9bee66f5153b26dc3a33b282', 'AMMA Arcade Contract', true) on conflict do nothing;

insert into games (name, slug, category, url, category_confirmed) values ('Pistols at Dawn', 'pistols', 'Action / PvP', '*.pistols.gg', true) on conflict (slug) do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('pistols', '0x02c6a7c98a9dea8322b51018eef7be99ebedd209cebdaacb9f4c5bbf661c1cc9', '', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('pistols', '0x016f7e3c140b4778e776221c7bb8b880d20d247c3ab0d06fab9a8eb96e7098bb', '', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('pistols', '0x032b34bd76a2eff13fafa0d9ba8d05a9bafac8e6210f28f4ae1ab7465ee47176', '', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('pistols', '0x03c77186b8e509085ec66e1a5d1dbcf9dc1f212852b4c1f461a48901d290fc9b', '', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('pistols', '0x0426c16fe76f12586718c07e47c8e4312e9fee5e7dc849a75f3c587ad9e70b4f', '', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('pistols', '0x071333ac75b7d5ba89a2d0c2b67d5b955258a4d46eb42f3428da6137bbbfdfd9', '', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('pistols', '0x02e9c711b1a7e2784570b1bda5082a92606044e836ba392d2b977d280fb74b3c', '', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('pistols', '0x07aaa9866750a0db82a54ba8674c38620fa2f967d2fbb31133def48e0527c87f', '', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('pistols', '0x014aa76e6c6f11e3f657ee2c213a62006c78ff2c6f8ed40b92c42fd554c246f2', '', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('pistols', '0x068a7a07e08fc3e723a878223d00f669106780d5ea6665eb15d893476d47bf3b', '', true) on conflict do nothing;

insert into games (name, slug, category, url, category_confirmed) values ('zKube', 'zkube', 'Puzzle / Casual', 'app.zkube.xyz', true) on conflict (slug) do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('zkube', '0x642f228f70b1ca7edb4ab7ff0bab067369c2e276ddc2570ca18802d4e758edc', 'zKube Game', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('zkube', '0x7547efb9801fb1e1b6afb09ba614131e1e7511d82890e1db7a6a14482bd6ae1', 'zKube Moves', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('zkube', '0x5a6da65b5a4a7514df77276bd90011eecb21d61a3b86a9f83e588aaa1aa59a6', 'zKube Daily Challenge', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('zkube', '0x375430f49bc0ca09b4bc36982e09c149cc4eb1aaed46387d3d9bda6ef9b313b', 'zKube Story', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('zkube', '0x2725b70dd1d5d2f074055b51ed1b45ab5bcb8e0d91b20dab0d0a0cb75c3fdb9', 'zKube Config', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('zkube', '0x207804835a74646fda655b8f2968307440f6b14fe8d52fdef2782d6075e527f', 'zKube Level', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('zkube', '0x21fb4dd4c413821cca0232e45bfb81835d6df0d6ef877b787f3de6530716e09', 'zKube Progress', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('zkube', '0x18e3ac77a56ea91ea9a575aceb252e2436d099ecb3bf9567963fd3c20782630', 'zKube Weekly Endless', true) on conflict do nothing;

insert into games (name, slug, category, url, category_confirmed) values ('GM NFT', 'guessmynft', 'Puzzle / Casual', 'guessmynft.com', true) on conflict (slug) do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('guessmynft', '0x561d264be3effa7dd35a3a8a77300e451afe64596c853255c8e74d5d73b4093', 'guessmyNFT Game', true) on conflict do nothing;

insert into games (name, slug, category, url, category_confirmed) values ('Nums', 'nums', 'Puzzle / Casual', '*.nums.gg', true) on conflict (slug) do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('nums', '0x575bd762ac42b1386a8da0d07f646ac631786eab359f3f39f1b53208208ab9c', 'Game Actions', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('nums', '0x1a8516498b484f209aefbbf5af67765a2b1e3889fd00902811f18576a4616b0', 'Management Actions', true) on conflict do nothing;
  insert into game_contracts (game_slug, address, label, counts_toward_activity) values ('nums', '0x6622cf22b64731ed444dbb07f4041268c503fa9573649571bfdfabe90c6ec2', 'vNUMS', true) on conflict do nothing;

-- Jokers of Neon is on the site but runs on its own Katana app-chain
-- (WP_JOKERS_CORE_SEASON3), not Starknet mainnet. No contract rows yet — see notes.
insert into games (name, slug, category, url, category_confirmed) values ('Jokers of Neon', 'jokers-of-neon', 'Card Games', 'https://jokersofneon.com/', true) on conflict (slug) do nothing;
select sync_shared_infra();