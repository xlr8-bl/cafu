-- Maison Cafu — Cameroonian menu seed data.
-- Dish names use the form most Cameroonians know (Ndolé, Poulet DG, Mbongo Tchobi, etc.)
-- but UI labels and descriptions are in English.

INSERT INTO menu_categories (slug, name, sort_order) VALUES
  ('mains',    'Mains',           1),
  ('grill',    'From the grill',  2),
  ('sides',    'Sides',           3),
  ('drinks',   'Drinks',          4),
  ('desserts', 'Desserts',        5);

-- Mains
INSERT INTO menu_items (category_id, name, description, price_cents, tags, image_url) VALUES
  (1, 'Ndolé with shrimp',
      'The Douala classic — bitter leaves slow-cooked with crayfish, peanut paste, and tender beef. Served with miondo.',
      5800, JSON_ARRAY('signature','house'),       '/images/ndole.jpg'),
  (1, 'Poulet DG',
      'The "Director General" — pan-roasted chicken, sweet ripe plantain, carrots, green pepper and a deep tomato sauce.',
      5400, JSON_ARRAY('classic','hearty'),        '/images/poulet-dg.jpg'),
  (1, 'Achu with yellow soup',
      'Pounded cocoyam pillow with limestone-yellow sauce, ngon seeds, beef tripe and smoked fish. From Bamenda.',
      5600, JSON_ARRAY('signature','smoky'),       '/images/achu.jpg'),
  (1, 'Eru with garri',
      'Wild eru leaves and waterleaf simmered in palm oil with stockfish and pork. A South-West Sunday plate.',
      5200, JSON_ARRAY('bold','smoky'),            '/images/eru.jpg'),
  (1, 'Mbongo Tchobi',
      'The black stew — fish or beef in mbongo spice and roasted njangsa. Bassa heritage, slow and smoky.',
      5400, JSON_ARRAY('signature','spicy'),       '/images/mbongo.jpg'),
  (1, 'Goat Kondre',
      'Slow-braised goat with green plantain, garlic and basil. A long Sunday plate from the West.',
      6200, JSON_ARRAY('house','hearty'),          '/images/kondre.jpg');

-- Grill
INSERT INTO menu_items (category_id, name, description, price_cents, tags, image_url) VALUES
  (2, 'Beef soya',
      'Tenderloin skewered, dusted in ground peanut, ginger and dry pepper. Charred over open flame.',
      3800, JSON_ARRAY('grilled','spicy'),         '/images/soya.jpg'),
  (2, 'Chef’s brochettes',
      'Mixed brochettes — beef and gizzards — served with raw onion, mustard, and a wedge of lime.',
      3400, JSON_ARRAY('grilled','classic'),       '/images/brochettes.jpg'),
  (2, 'Braised whole fish',
      'Whole tilapia braised over coals with ginger, garlic and folong leaves. With miondo and pepper sauce.',
      6400, JSON_ARRAY('grilled','signature'),     '/images/poisson.jpg');

-- Sides
INSERT INTO menu_items (category_id, name, description, price_cents, tags, image_url) VALUES
  (3, 'Bobolo',
      'Long fermented cassava stick, wrapped in banana leaves. The classic companion to ndolé.',
      900,  JSON_ARRAY('house'),                   '/images/bobolo.jpg'),
  (3, 'Miondo',
      'Steamed cassava sticks, softer and shorter than bobolo. Pairs with everything.',
      900,  JSON_ARRAY('house'),                   '/images/miondo.jpg'),
  (3, 'Corn fufu with njama njama',
      'Corn fufu mounded next to huckleberry leaves stewed with onion and a touch of palm oil.',
      2200, JSON_ARRAY('classic'),                 '/images/fufu.jpg');

-- Drinks
INSERT INTO menu_items (category_id, name, description, price_cents, tags, image_url) VALUES
  (4, 'Iced bissap',
      'Cold-brewed hibiscus, mint and a hint of pineapple. The colour of evening light.',
      1200, JSON_ARRAY('cold','sweet'),            '/images/bissap.jpg'),
  (4, 'Matango (palm wine)',
      'Fresh-tapped palm wine from the village. Served cold, by the gourd.',
      1600, JSON_ARRAY('house'),                   '/images/matango.jpg'),
  (4, 'House ginger',
      'Pounded ginger, lime, raw cane sugar. Strong, the way it should be.',
      1100, JSON_ARRAY('spicy','cold'),            '/images/gingembre.jpg');

-- Desserts
INSERT INTO menu_items (category_id, name, description, price_cents, tags, image_url) VALUES
  (5, 'Akwadu',
      'Baked plantain with coconut, brown sugar and a splash of orange. From the coastal kitchens.',
      2200, JSON_ARRAY('sweet'),                   '/images/akwadu.jpg'),
  (5, 'Chin chin',
      'Crispy fried pastry strips. Sweet, the kind your aunt sends in a jar.',
      1400, JSON_ARRAY('classic','sweet'),         '/images/chinchin.jpg'),
  (5, 'Puff puff',
      'Yeasted fried dough balls dusted with sugar. Best while they are still hot from the pan.',
      1200, JSON_ARRAY('house','sweet'),           '/images/puffpuff.jpg');

-- Cameroonian customers across regions.
INSERT INTO customers (name, phone, email) VALUES
  ('Yvonne Atangana',  '+237 671 204 819', 'yvonne@example.test'),
  ('Patrice Mbappé',   '+237 698 411 062', NULL),
  ('Solange Ngongang', '+237 677 552 940', 'solange@example.test'),
  ('Jean-Marc Tchami', '+237 695 113 786', NULL),
  ('Aminatou Bello',   '+237 670 998 221', 'aminatou@example.test'),
  ('Christian Ekema',  '+237 656 887 410', NULL);

-- Historical orders for the recommender. Real pairings:
-- ndolé + bobolo, eru + miondo + bissap, poulet DG + bissap, soya + matango,
-- achu + bissap, mbongo + fufu, kondre + matango.
INSERT INTO orders (customer_id, reference, status, total_cents, placed_at) VALUES
  (1, 'A4F7H9K2P1', 'served', 6700, NOW() - INTERVAL 9 DAY),
  (2, 'B8N3M2X7Q4', 'served', 6800, NOW() - INTERVAL 8 DAY),
  (3, 'C2J5L8R6W9', 'served', 6600, NOW() - INTERVAL 7 DAY),
  (4, 'D9V1Y3Z5E8', 'served', 5400, NOW() - INTERVAL 6 DAY),
  (5, 'E5T4U6I2O7', 'served', 6800, NOW() - INTERVAL 5 DAY),
  (1, 'F2H8K3Q4R7', 'served', 7800, NOW() - INTERVAL 4 DAY),
  (6, 'G7M1N9P4T6', 'served', 6100, NOW() - INTERVAL 3 DAY),
  (2, 'H4S2V9W5X3', 'served', 5400, NOW() - INTERVAL 2 DAY),
  (3, 'J9R6Q1L2M8', 'served', 6800, NOW() - INTERVAL 1 DAY);

-- Order items keyed to menu_items by insertion order:
-- 1=ndolé, 2=poulet-dg, 3=achu, 4=eru, 5=mbongo, 6=kondre,
-- 7=soya, 8=brochettes, 9=poisson,
-- 10=bobolo, 11=miondo, 12=fufu,
-- 13=bissap, 14=matango, 15=gingembre,
-- 16=akwadu, 17=chinchin, 18=puffpuff
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_cents) VALUES
  (1, 1, 1, 5800), (1, 10, 1, 900),
  (2, 4, 1, 5200), (2, 11, 1, 900), (2, 13, 1, 1200),
  (3, 3, 1, 5600), (3, 13, 1, 1200),
  (4, 2, 1, 5400),
  (5, 5, 1, 5400), (5, 12, 1, 2200), (5, 15, 1, 1100),
  (6, 6, 1, 6200), (6, 14, 1, 1600),
  (7, 7, 1, 3800), (7, 14, 1, 1600), (7, 13, 1, 1200),
  (8, 2, 1, 5400),
  (9, 1, 1, 5800), (9, 10, 1, 900), (9, 18, 1, 1200);

INSERT INTO reservations (customer_id, party_size, reserved_for, status, notes) VALUES
  (1, 2, NOW() + INTERVAL 1 DAY, 'confirmed', 'Window seat — anniversary'),
  (3, 4, NOW() + INTERVAL 3 DAY, 'held',      NULL),
  (5, 6, NOW() + INTERVAL 5 DAY, 'confirmed', 'Family — go easy on the pepper');
