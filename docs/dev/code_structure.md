A game script use the engines libs to create rooms, items and peoples.

# Engine
## Design pattern ?
The engine is not clearly designed in a MVC or MVVM structure.

  (If you can name a design pattern which is compatible with the current structure, just tell me)

## Classes or Parts
Commands, Rooms, Items, Peoples, GameStates, Pics, Sounds are models (but some of thes can contains the method to represent themselves).

Textual elements are called through GetText which get the dialogs defined in a other file.

VTerm is a view that interact with some models.

The game script (out of the engine) is the controller.

## Code Structure
```
      EventTarget
          |            raise events
         File        --that act on-->    State
      /   |   \
  People Item   Room
  

```
