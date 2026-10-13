import pytest
from pydantic import ValidationError
from app.models.schemas import DealerData, DemandData, VehicleData

def test_dealer_schema_valid():
    dealer = DealerData(
        dealer_id=1,
        name="Dealer North",
        latitude=13.0827,
        longitude=80.2707,
        holding_cost_per_unit=2.5
    )
    assert dealer.dealer_id == 1
    assert dealer.name == "Dealer North"
    assert dealer.holding_cost_per_unit == 2.5

def test_dealer_schema_invalid():
    with pytest.raises(ValidationError):
        DealerData(
            dealer_id="not_an_int",
            name="Invalid",
            latitude="invalid_lat",
            longitude=80.0,
            holding_cost_per_unit=1.0
        )

def test_demand_schema():
    demand = DemandData(
        dealer_id=1,
        mean_demand=25.0,
        std_demand=5.0
    )
    assert demand.dealer_id == 1
    assert demand.mean_demand == 25.0
    assert demand.std_demand == 5.0

def test_vehicle_schema():
    vehicle = VehicleData(
        vehicle_id=1,
        capacity=500.0,
        cost_per_km=15.0
    )
    assert vehicle.vehicle_id == 1
    assert vehicle.capacity == 500.0
    assert vehicle.cost_per_km == 15.0
