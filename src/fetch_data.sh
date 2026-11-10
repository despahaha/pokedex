#!/bin/sh
# Downloads the PokeAPI CSV tables the build needs into src/data/ (not committed).
set -e
cd "$(dirname "$0")" && mkdir -p data && cd data
for f in pokemon pokemon_species pokemon_species_names pokemon_types pokemon_types_past pokemon_stats pokemon_stats_past \
  pokemon_evolution pokemon_dex_numbers types type_efficacy type_efficacy_past items item_names moves locations location_names \
  location_areas encounters encounter_slots encounter_methods encounter_condition_values encounter_condition_value_map \
  pokemon_moves move_changelog machines move_names abilities ability_names pokemon_abilities pokemon_abilities_past \
  pokemon_egg_groups egg_group_prose version_groups; do
  [ -f "$f.csv" ] || curl -fsS -o "$f.csv" "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/$f.csv"
done
