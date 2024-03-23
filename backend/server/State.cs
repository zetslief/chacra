using System.Text.Json.Serialization;

namespace Chacra.State; 

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(InitialState), nameof(InitialState))]
[JsonDerivedType(typeof(GameStartState), nameof(GameStartState))]
[JsonDerivedType(typeof(GameFinishedState), nameof(GameFinishedState))]
[JsonDerivedType(typeof(InputState), nameof(InputState))]
[JsonDerivedType(typeof(DeltaState), nameof(DeltaState))]
[JsonDerivedType(typeof(KnownBoosterState), nameof(KnownBoosterState))]
public abstract record State();
public record InitialState(GameData Game, PlayerData[] Players) : State();
public record GameStartState(float X, float Y) : State();
public record InputState(string Type, string PlayerName, float Dx, float Dy) : State();
public record GameFinishedState() : State();
public record DeltaState(long Delta) : State();
public record KnownBoosterState(string Name, string Color, float Weight) : State();

// I do not like that this type is called `Data`.
// `Data` should not be be polimorphic. Inheritance is allowed?
public record PlayerData(string Name, string Color);
public record GameData(int FieldWidth, int FieldHeight);
