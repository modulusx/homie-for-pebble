#include "pebble.h"

#define KEY_MENU_ITEMS 0
#define KEY_MENU_TITLE 1
#define KEY_MENU_URL 2

typedef struct {
  Window *menu_window;
  SimpleMenuLayer *menu_layer;
  SimpleMenuSection *menu_sections;
  SimpleMenuItem *menu_items;
	int index;
  int num_sections;
  int num_items;
  char* titles;
	char* urls;
} WindowConfig;

static WindowConfig *s_main;

static void menu_select_callback(int index, void *ctx) {
  s_main->menu_items[index].subtitle = "You've hit select here!";
  layer_mark_dirty(simple_menu_layer_get_layer(s_main->menu_layer));
}

static void menu_window_load(Window *window) {
  int num_a_items = 0;

  s_main->menu_items[num_a_items++] = (SimpleMenuItem) {
    .title = "Loading...",
    .callback = menu_select_callback,
  };

  s_main->menu_sections[0] = (SimpleMenuSection) {
		.title = PBL_IF_RECT_ELSE("Homie", NULL),
    .num_items = s_main->num_items,
    .items = s_main->menu_items,
  };

  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_frame(window_layer);
  s_main->menu_layer = simple_menu_layer_create(bounds, window, s_main->menu_sections, s_main->num_sections, NULL);
  layer_add_child(window_layer, simple_menu_layer_get_layer(s_main->menu_layer));
}

void menu_window_unload(Window *window) {
  simple_menu_layer_destroy(s_main->menu_layer);
}

WindowConfig* createWC() {
	WindowConfig *wc;
	wc = malloc(sizeof(WindowConfig));
	
  wc->num_sections = 1;
  wc->num_items = 1;
  wc->index = 0;
  wc->menu_window = window_create();
  wc->menu_sections = malloc(wc->num_sections * sizeof(SimpleMenuSection));
  wc->menu_items = malloc(wc->num_items * sizeof(SimpleMenuItem));
  wc->titles = malloc(sizeof(char)*16);
  wc->urls = malloc(sizeof(char)*64);

	return wc;
}

void updateWC() {
	free(s_main->menu_items);
	free(s_main->menu_sections);
  s_main->menu_items = malloc(s_main->num_items * sizeof(SimpleMenuItem));
	s_main->menu_sections = malloc(s_main->num_sections * sizeof(SimpleMenuSection));
  simple_menu_layer_destroy(s_main->menu_layer);

	for (int i=0; i < s_main->num_items; i++) {
    s_main->menu_items[i] = (SimpleMenuItem) {
      .title = &s_main->titles[i*16],
      .callback = menu_select_callback,
    };
	}

	s_main->menu_sections[0] = (SimpleMenuSection) {
		.title = PBL_IF_RECT_ELSE("Homie", NULL),
    .num_items = s_main->num_items,
    .items = s_main->menu_items,
  };

	Layer *window_layer = window_get_root_layer(s_main->menu_window);
  GRect bounds = layer_get_frame(window_layer);
	s_main->menu_layer = simple_menu_layer_create(bounds, s_main->menu_window, s_main->menu_sections, s_main->num_sections, NULL);
  layer_add_child(window_layer, simple_menu_layer_get_layer(s_main->menu_layer));
}

void deleteWC() {
  free(s_main->menu_sections);
  free(s_main->menu_items);
  free(s_main->titles);
  free(s_main->urls);
}

static void inbox_received_callback(DictionaryIterator *iterator, void *context) {
  // Store incoming information
  static char buffer_title[16];
  static char buffer_url[64];

  // Read first item
  Tuple *t = dict_read_first(iterator);

  // For all items
  while(t != NULL) {
    switch(t->key) {
    case KEY_MENU_ITEMS:
      s_main->num_items = t->value->uint32;
			free(s_main->titles);
			s_main->titles = malloc(s_main->num_items * sizeof(char) * 16);
			free(s_main->urls);
			s_main->urls = malloc(s_main->num_items * sizeof(char) * 64);
      break;
    case KEY_MENU_TITLE:
      snprintf(buffer_title, sizeof(buffer_title), "%s", t->value->cstring);
			memcpy(&s_main->titles[s_main->index*16],&buffer_title,16);
      break;
    case KEY_MENU_URL:
      snprintf(buffer_url, sizeof(buffer_url), "%s", t->value->cstring);
			memcpy(&s_main->urls[s_main->index*64],&buffer_url,64);
			s_main->index++;
      break;
    default:
      APP_LOG(APP_LOG_LEVEL_ERROR, "Key %d not recognized!", (int)t->key);
      break;
    }

    // Look for next item
    t = dict_read_next(iterator);
  }

  if (s_main->index == s_main->num_items)
   updateWC();
}

static void inbox_dropped_callback(AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_ERROR, "Message dropped!");
}

static void outbox_failed_callback(DictionaryIterator *iterator, AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_ERROR, "Outbox send failed!");
}

static void outbox_sent_callback(DictionaryIterator *iterator, void *context) {
  APP_LOG(APP_LOG_LEVEL_INFO, "Outbox send success!");
}

static void init() {
  s_main = createWC();

  window_set_window_handlers(s_main->menu_window, (WindowHandlers) {
    .load = menu_window_load,
    .unload = menu_window_unload,
  });
  window_stack_push(s_main->menu_window, true);
	
  // Register callbacks
  app_message_register_inbox_received(inbox_received_callback);
  app_message_register_inbox_dropped(inbox_dropped_callback);
  app_message_register_outbox_failed(outbox_failed_callback);
  app_message_register_outbox_sent(outbox_sent_callback);
  
  // Open AppMessage
  app_message_open(app_message_inbox_size_maximum(), app_message_outbox_size_maximum());
}

static void deinit() {
  window_destroy(s_main->menu_window);
	deleteWC();
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}