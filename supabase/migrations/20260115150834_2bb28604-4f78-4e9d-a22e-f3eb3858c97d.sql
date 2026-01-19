-- Create enums for storage, condition, and city
CREATE TYPE phone_storage AS ENUM (
  '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'
);

CREATE TYPE phone_condition AS ENUM (
  'yaxshi', 'ortacha', 'yaxshi_emas'
);

CREATE TYPE uzbekistan_city AS ENUM (
  'Toshkent',
  'Samarqand',
  'Buxoro',
  'Namangan',
  'Andijon',
  'Fargona',
  'Qarshi',
  'Nukus',
  'Urganch',
  'Jizzax',
  'Navoiy',
  'Guliston',
  'Termiz',
  'Chirchiq'
);

-- Delete all existing phones data first (this will cascade to related tables)
DELETE FROM phone_images;
DELETE FROM favorites WHERE phone_id IN (SELECT id FROM phones);
DELETE FROM messages WHERE phone_id IN (SELECT id FROM phones);
DELETE FROM notifications WHERE phone_id IN (SELECT id FROM phones);
DELETE FROM phones;

-- Drop old columns from phones
ALTER TABLE phones DROP COLUMN IF EXISTS image_url;
ALTER TABLE phones DROP COLUMN IF EXISTS brand_id;

-- Add new columns to phones
ALTER TABLE phones ADD COLUMN storage phone_storage NOT NULL DEFAULT '128GB';
ALTER TABLE phones ADD COLUMN condition phone_condition NOT NULL DEFAULT 'yaxshi';
ALTER TABLE phones ADD COLUMN city uzbekistan_city NOT NULL DEFAULT 'Toshkent';

-- Change price to bigint
ALTER TABLE phones ALTER COLUMN price TYPE bigint USING price::bigint;